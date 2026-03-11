const express3 = require('express');
const { verifyToken: vt3, isAdmin: ia3 } = require('../middleware/auth');
const router3 = express3.Router();

router3.get('/', vt3, ia3, async (req, res) => {
  const db = req.app.locals.db;
  
  try {
    const [users] = await db.query(
      'SELECT id, username, email, full_name, phone, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to fetch users', status: 500 } });
  }
});
router3.get('/:id', vt3, ia3, async (req, res) => {
  const db = req.app.locals.db;
  
  try {
    const [users] = await db.query(
      'SELECT id, username, email, full_name, phone, role, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: { message: 'User not found', status: 404 } });
    }
    
    res.json({ user: users[0] });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to fetch user', status: 500 } });
  }
});

router3.put('/:id/role', vt3, ia3, async (req, res) => {
  const db = req.app.locals.db;
  const { role } = req.body;
  
  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    const [user] = await db.query(
      'SELECT id, username, email, full_name, role FROM users WHERE id = ?',
      [req.params.id]
    );
    res.json({ message: 'User role updated', user: user[0] });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to update user role', status: 500 } });
  }
});

router3.delete('/:id', vt3, ia3, async (req, res) => {
  const db = req.app.locals.db;
  
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to delete user', status: 500 } });
  }
});

module.exports = router3;