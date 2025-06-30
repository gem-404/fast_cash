const express = require('express');
const router = express.Router();
const db = require('../db');

// Create new loan
router.post('/', async (req, res) => {
  try {
    const { userId, amount, term } = req.body;
    
    // Check savings requirement
    const savings = await db.get(
      'SELECT SUM(amount) as balance FROM savings WHERE user_id = ?',
      [userId]
    );
    
    const requiredSavings = Math.ceil(amount * 0.3);
    if (savings.balance < requiredSavings) {
      return res.status(400).json({ 
        error: `You need at least ${requiredSavings} in savings` 
      });
    }
    
    // Create loan
    const result = await db.run(
      'INSERT INTO loans (user_id, amount, term) VALUES (?, ?, ?)',
      [userId, amount, term]
    );
    
    res.status(201).json({ loanId: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user loans
router.get('/:userId', async (req, res) => {
  try {
    const loans = await db.all(
      'SELECT * FROM loans WHERE user_id = ?',
      [req.params.userId]
    );
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
