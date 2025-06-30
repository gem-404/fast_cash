const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, nationalId, email, password } = req.body;
    
    // Check if user exists
    // const userExists = await db.get(
    //   'SELECT id FROM users WHERE phone = ? OR national_id = ?', 
    //   [phone, nationalId]
    // );
    // 
    // if (userExists) {
    //   return res.status(400).json({ error: 'User already exists' });
    // }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await db.run(
      `INSERT INTO users 
      (full_name, phone, national_id, email, password_hash) 
      VALUES (?, ?, ?, ?, ?)`,
      [fullName, phone, nationalId, email, hashedPassword]
    );
    
    // Create savings account
    await db.run(
      'INSERT INTO savings (user_id, amount) VALUES (?, ?)',
      [result.lastID, 0]
    );
    
    res.status(201).json({ userId: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    // Find user
    const user = await db.get(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return user data (without password)
    const { password_hash, ...userData } = user;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
