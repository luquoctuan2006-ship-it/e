const express = require('express');
const { verifyToken, isAdmin } = require('../middleware/auth');
const router = express.Router();


router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [venues] = await db.query('SELECT * FROM venues ORDER BY name');
    res.json({ venues });
  } catch (err) {
    console.error('Get venues error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch venues', status: 500 } });
  }
});

router.get('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [venues] = await db.query('SELECT * FROM venues WHERE id = ?', [req.params.id]);
    if (venues.length === 0) {
      return res.status(404).json({ error: { message: 'Venue not found', status: 404 } });
    }
    res.json({ venue: venues[0] });
  } catch (err) {
    console.error('Get venue error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch venue', status: 500 } });
  }
});

module.exports = router;