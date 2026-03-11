const express = require('express');
const { verifyToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [organizers] = await db.query('SELECT * FROM organizers ORDER BY name');
    res.json({ organizers });
  } catch (err) {
    console.error('Get organizers error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch organizers', status: 500 } });
  }
});

router.get('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [organizers] = await db.query('SELECT * FROM organizers WHERE id = ?', [req.params.id]);
    if (organizers.length === 0) {
      return res.status(404).json({ error: { message: 'Organizer not found', status: 404 } });
    }
    res.json({ organizer: organizers[0] });
  } catch (err) {
    console.error('Get organizer error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch organizer', status: 500 } });
  }
});

router.post('/', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { name, email, phone, description, website, logo_url } = req.body;
  
  try {
    const [result] = await db.query(
      'INSERT INTO organizers (name, email, phone, description, website, logo_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, description, website, logo_url]
    );
    const [organizer] = await db.query('SELECT * FROM organizers WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Organizer created', organizer: organizer[0] });
  } catch (err) {
    console.error('Create organizer error:', err);
    res.status(500).json({ error: { message: 'Failed to create organizer', status: 500 } });
  }
});

router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { name, email, phone, description, website, logo_url } = req.body;
  
  try {
    await db.query(
      'UPDATE organizers SET name = ?, email = ?, phone = ?, description = ?, website = ?, logo_url = ? WHERE id = ?',
      [name, email, phone, description, website, logo_url, req.params.id]
    );
    const [organizer] = await db.query('SELECT * FROM organizers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Organizer updated', organizer: organizer[0] });
  } catch (err) {
    console.error('Update organizer error:', err);
    res.status(500).json({ error: { message: 'Failed to update organizer', status: 500 } });
  }
});

router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.query('DELETE FROM organizers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Organizer deleted' });
  } catch (err) {
    console.error('Delete organizer error:', err);
    res.status(500).json({ error: { message: 'Failed to delete organizer', status: 500 } });
  }
});

module.exports = router;