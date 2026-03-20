const express = require('express');
const { optionalAuth, verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Allow both authenticated and anonymous users; if the token is provided we will associate the message
router.post('/', optionalAuth, async (req, res) => {
  const db = req.app.locals.db;
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      error: { message: 'Name, email and message are required', status: 400 }
    });
  }

  try {
    const userId = req.user ? req.user.id : null;
    const [result] = await db.query(
      `INSERT INTO contacts (user_id, name, email, subject, message, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, name, email, subject || null, message]
    );

    res.status(201).json({
      message: 'Contact request submitted successfully',
      contactId: result.insertId
    });
  } catch (err) {
    console.error('Create contact error:', err);
    res.status(500).json({
      error: { message: 'Failed to submit contact request', status: 500 }
    });
  }
});

// allow authenticated users to view their own messages
router.get('/me', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      'SELECT * FROM contacts WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ contacts: rows });
  } catch (err) {
    console.error('Get user contacts error:', err);
    res.status(500).json({
      error: { message: 'Failed to fetch your contact messages', status: 500 }
    });
  }
});

module.exports = router;
