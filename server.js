require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const DB_PATH = path.join(__dirname, "users.db");
const db = new sqlite3.Database(DB_PATH);

const mpesaRouter = require('./routes/mpesa');
app.use('/api/mpesa', mpesaRouter);

// Initialize database tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    national_id TEXT NOT NULL UNIQUE,
    email TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    term INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS savings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Authenticate user
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Route to serve index.html
app.get(["/", "/home"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API Endpoints
app.get("/api/loans", (req, res) => {
  db.all("SELECT * FROM loans", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/loans", express.json(), (req, res) => {
  const { user_id, amount, term } = req.body;
  db.run(
    "INSERT INTO loans (user_id, amount, term) VALUES (?, ?, ?)",
    [user_id, amount, term],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    },
  );
});

// Temporary debug route - remove in production
app.get("/api/debug/loans", (req, res) => {
  db.all("SELECT * FROM loans", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(
      rows.map((row) => ({
        ...row,
        amount: row.amount || 0, // Ensure amount is never undefined
      })),
    );
  });
});

// server.js - Add this with your other API endpoints
app.get("/api/users/:userId", (req, res) => {
  const userId = req.params.userId;

  // 1. Verify the user exists
  db.get(
    `SELECT id, full_name, phone, national_id, email, created_at 
     FROM users 
     WHERE id = ?`,
    [userId],
    (err, user) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          error: "Database error",
          details:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // 2. Return user data (excluding sensitive fields like password_hash)
      res.json({
        id: user.id,
        full_name: user.full_name,
        phone: user.phone,
        national_id: user.national_id,
        email: user.email,
        created_at: user.created_at,
        // Add any other non-sensitive fields you need
      });
    },
  );
});

// server.js - Add with your other API endpoints
app.get("/api/users/:userId/savings", (req, res) => {
  const userId = req.params.userId;

  // 1. Validate user exists
  db.get("SELECT id FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        error: "Database error",
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Get savings balance and history
    db.serialize(() => {
      // Get total balance
      db.get(
        `SELECT SUM(amount) as totalBalance 
         FROM savings 
         WHERE user_id = ?`,
        [userId],
        (err, balanceResult) => {
          if (err) {
            console.error("Balance query error:", err);
            return res.status(500).json({ error: "Failed to get balance" });
          }

          // Get transaction history
          db.all(
            `SELECT id, amount, created_at 
             FROM savings 
             WHERE user_id = ? 
             ORDER BY created_at DESC
             LIMIT 50`,
            [userId],
            (err, transactions) => {
              if (err) {
                console.error("Transactions query error:", err);
                return res
                  .status(500)
                  .json({ error: "Failed to get transactions" });
              }

              // Format response
              res.json({
                success: true,
                balance: balanceResult.totalBalance || 0,
                transactions: transactions.map((t) => ({
                  id: t.id,
                  amount: t.amount,
                  date: t.created_at,
                  formattedAmount: new Intl.NumberFormat("en-KE", {
                    style: "currency",
                    currency: "KES",
                  }).format(t.amount),
                })),
              });
            },
          );
        },
      );
    });
  });
});

app.post("/api/users/:userId/savings", express.json(), (req, res) => {
  const userId = req.params.userId;
  const { amount, notes } = req.body;

  // Validate input
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      error: "Invalid amount - must be a positive number",
    });
  }

  // Verify user exists
  db.get("SELECT id FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Record the transaction
    db.run(
      `INSERT INTO savings (user_id, amount, notes) 
       VALUES (?, ?, ?)`,
      [userId, amount, notes || null],
      function (err) {
        if (err) {
          console.error("Savings deposit error:", err);
          return res.status(500).json({
            error: "Failed to record savings deposit",
          });
        }

        // Get updated balance
        db.get(
          `SELECT SUM(amount) as newBalance 
           FROM savings 
           WHERE user_id = ?`,
          [userId],
          (err, result) => {
            if (err) {
              console.error("Balance check error:", err);
              return res.json({
                success: true,
                newBalance: amount, // Fallback to just the deposited amount
              });
            }

            res.json({
              success: true,
              transactionId: this.lastID,
              newBalance: result.newBalance || amount,
              message: "Savings deposited successfully",
            });
          },
        );
      },
    );
  });
});

// server.js - Update the active-loan endpoint
app.get("/api/users/:userId/active-loan", (req, res) => {
  const userId = req.params.userId;

  db.get(
    `SELECT * FROM loans 
     WHERE user_id = ? AND status = 'active'
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
    (err, row) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          error: "Database error",
          details:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }

      if (!row) {
        return res.json({
          hasActiveLoan: false,
          message: "No active loan found",
        });
      }

      // Ensure all numeric values are properly formatted
      res.json({
        hasActiveLoan: true,
        loan: {
          id: row.id,
          amount: row.amount || 0, // Fallback to 0 if undefined
          term: row.term || 0,
          status: row.status || "unknown",
          created_at: row.created_at,
          formattedAmount: (row.amount || 0).toLocaleString("en-KE", {
            style: "currency",
            currency: "KES",
          }),
        },
      });
    },
  );
});

// server.js - Add loan application endpoint
app.post("/api/users/:userId/apply-loan", express.json(), (req, res) => {
  const userId = req.params.userId;
  const { amount, term } = req.body;

  // Validate input
  if (!amount || !term) {
    return res.status(400).json({ error: "Amount and term are required" });
  }

  // 1. Check user exists
  db.get("SELECT id FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!user) return res.status(404).json({ error: "User not found" });

    // 2. Check savings requirement (30% of loan amount)
    db.get(
      "SELECT SUM(amount) as total FROM savings WHERE user_id = ?",
      [userId],
      (err, savings) => {
        if (err) return res.status(500).json({ error: "Database error" });

        const requiredSavings = amount * 0.3;
        if ((savings.total || 0) < requiredSavings) {
          return res.status(403).json({
            error: `Insufficient savings. You need ${requiredSavings} Ksh to borrow ${amount} Ksh`,
          });
        }

        // 3. Check if user has existing active loan
        db.get(
          `SELECT id FROM loans 
           WHERE user_id = ? AND status = 'active'
           LIMIT 1`,
          [userId],
          (err, existingLoan) => {
            if (err) return res.status(500).json({ error: "Database error" });
            if (existingLoan) {
              return res.status(403).json({
                error: "You already have an active loan",
              });
            }

            // 4. Create new loan application
            db.run(
              `INSERT INTO loans 
               (user_id, amount, term, status)
               VALUES (?, ?, ?, 'pending')`,
              [userId, amount, term],
              function (err) {
                if (err)
                  return res
                    .status(500)
                    .json({ error: "Failed to create loan" });

                res.json({
                  success: true,
                  loanId: this.lastID,
                  message: "Loan application submitted for review",
                });
              },
            );
          },
        );
      },
    );
  });
});

// Helper function to calculate due date
function calculateDueDate(createdAt, termDays) {
  const createdDate = new Date(createdAt);
  const dueDate = new Date(createdDate);
  dueDate.setDate(dueDate.getDate() + termDays);
  return dueDate.toISOString();
}

// Updated savings endpoint in server.js
app.post("/api/users/:userId/savings", express.json(), (req, res) => {
  const userId = req.params.userId;
  const { amount } = req.body;

  // Validate input
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  // First check if user exists
  db.get("SELECT id FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add savings record
    db.run(
      `INSERT INTO savings (user_id, amount) VALUES (?, ?)`,
      [userId, amount],
      function (err) {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Failed to add savings" });
        }

        // Get updated total savings
        db.get(
          `SELECT SUM(amount) as total FROM savings WHERE user_id = ?`,
          [userId],
          (err, result) => {
            if (err) {
              console.error("Failed to get balance:", err);
              return res.json({ success: true, newBalance: amount });
            }

            res.json({
              success: true,
              newBalance: result.total || amount,
            });
          },
        );
      },
    );
  });
});

app.get("/api/users/:userId/savings-balance", (req, res) => {
  const userId = req.params.userId;

  db.get(
    `SELECT SUM(amount) as balance FROM savings WHERE user_id = ?`,
    [userId],
    (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to get balance" });
      }

      res.json({
        balance: result.balance || 0,
      });
    },
  );
});

// Add these near other API endpoints in server.js
app.post("/api/auth/register", express.json(), async (req, res) => {
  try {
    const { fullName, phone, nationalId, email, password } = req.body;

    // Validate required fields
    if (!fullName || !phone || !nationalId || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check for existing phone or national ID first
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM users WHERE phone = ? OR national_id = ?`,
        [phone, nationalId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        },
      );
    });

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists with this phone or national ID",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users 
         (full_name, phone, national_id, email, password_hash)
         VALUES (?, ?, ?, ?, ?)`,
        [fullName, phone, nationalId, email, hashedPassword],
        function (err) {
          if (err) reject(err);
          resolve(this);
        },
      );
    });

    res.status(201).json({ userId: result.lastID });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === "SQLITE_CONSTRAINT") {
      // Handle specific constraint errors
      if (error.message.includes("users.phone")) {
        res.status(409).json({ error: "Phone number already in use" });
      } else if (error.message.includes("users.national_id")) {
        res.status(409).json({ error: "National ID already registered" });
      } else {
        res.status(409).json({ error: "Duplicate data violation" });
      }
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

app.post("/api/auth/login", express.json(), async (req, res) => {
  try {
    // 1. Validate request body
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password are required" });
    }

    // 2. Find user
    const user = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE phone = ?", [phone], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 3. Verify password hash exists
    if (!user.password_hash) {
      return res.status(500).json({ error: "User record corrupted" });
    }

    // 4. Compare passwords
    const passwordMatch = await new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password_hash, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 5. Return user data (without password)
    const { password_hash, ...userData } = user;
    res.json({
      ...userData,
      createdAt: user.created_at, // Format date if needed
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Login failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
