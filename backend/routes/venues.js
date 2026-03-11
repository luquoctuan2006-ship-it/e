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

router.post('/', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { name, address, city, capacity, amenities, map_url, contact_phone } = req.body;
  
  try {
    const [result] = await db.query(
      'INSERT INTO venues (name, address, city, capacity, amenities, map_url, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, address, city, capacity, amenities, map_url, contact_phone]
    );
    const [venue] = await db.query('SELECT * FROM venues WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Venue created', venue: venue[0] });
  } catch (err) {
    console.error('Create venue error:', err);
    res.status(500).json({ error: { message: 'Failed to create venue', status: 500 } });
  }
});

router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { name, address, city, capacity, amenities, map_url, contact_phone } = req.body;
  
  try {
    await db.query(
      'UPDATE venues SET name = ?, address = ?, city = ?, capacity = ?, amenities = ?, map_url = ?, contact_phone = ? WHERE id = ?',
      [name, address, city, capacity, amenities, map_url, contact_phone, req.params.id]
    );
    const [venue] = await db.query('SELECT * FROM venues WHERE id = ?', [req.params.id]);
    res.json({ message: 'Venue updated', venue: venue[0] });
  } catch (err) {
    console.error('Update venue error:', err);
    res.status(500).json({ error: { message: 'Failed to update venue', status: 500 } });
  }
});

router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.query('DELETE FROM venues WHERE id = ?', [req.params.id]);
    res.json({ message: 'Venue deleted' });
  } catch (err) {
    console.error('Delete venue error:', err);
    res.status(500).json({ error: { message: 'Failed to delete venue', status: 500 } });
  }
});

module.exports = router;