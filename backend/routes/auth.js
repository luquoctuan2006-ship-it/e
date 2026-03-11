
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

router.post('/register', async (req, res) => {
  const db = req.app.locals.db;
  const { username, email, password, full_name, phone, role, organizerData } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: { message: 'Username, email, and password are required', status: 400 } 
      });
    }
    const validRoles = ['user', 'organizer'];
    const userRole = validRoles.includes(role) ? role : 'user';

    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        error: { message: 'User already exists', status: 409 } 
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('START TRANSACTION');

    try {
      const [userResult] = await db.query(
        'INSERT INTO users (username, email, password, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
        [username, email, hashedPassword, full_name || null, phone || null, userRole]
      );

      const userId = userResult.insertId;

      if (userRole === 'organizer') {
        if (!organizerData || !organizerData.name) {
          await db.query('ROLLBACK');
          return res.status(400).json({ 
            error: { message: 'Organizer name is required', status: 400 } 
          });
        }
        await db.query(
          'INSERT INTO organizers (name, email, phone, description, website, logo_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            organizerData.name,
            organizerData.email || email,
            organizerData.phone || phone,
            organizerData.description || null,
            organizerData.website || null,
            organizerData.logo_url || null,
            userId
          ]
        );
      }

      await db.query('COMMIT');

      const token = jwt.sign(
        { id: userId, username, email, role: userRole },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const [user] = await db.query(
        'SELECT id, username, email, full_name, phone, role, created_at FROM users WHERE id = ?',
        [userId]
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: user[0]
      });

    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to register user', status: 500 } 
    });
  }
});

router.post('/login', async (req, res) => {
  const db = req.app.locals.db;
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ 
        error: { message: 'Email and password are required', status: 400 } 
      });
    }
    const [users] = await db.query(
      'SELECT id, username, email, password, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: { message: 'Invalid email or password', status: 401 } 
      });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ 
        error: { message: 'Invalid email or password', status: 401 } 
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const [userDetails] = await db.query(
      'SELECT id, username, email, full_name, phone, role, created_at FROM users WHERE id = ?',
      [user.id]
    );

    res.json({
      message: 'Login successful',
      token,
      user: userDetails[0]
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to login', status: 500 } 
    });
  }
});
router.get('/me', verifyToken, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [user] = await db.query(
      'SELECT id, username, email, full_name, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({ 
        error: { message: 'User not found', status: 404 } 
      });
    }

    res.json({ user: user[0] });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to fetch user', status: 500 } 
    });
  }
});
router.put('/profile', verifyToken, async (req, res) => {
  const db = req.app.locals.db;
  const { full_name, phone } = req.body;

  try {
    await db.query(
      'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
      [full_name || null, phone || null, req.user.id]
    );

    const [user] = await db.query(
      'SELECT id, username, email, full_name, phone, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: user[0]
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to update profile', status: 500 } 
    });
  }
});
router.post('/change-password', verifyToken, async (req, res) => {
  const db = req.app.locals.db;
  const { oldPassword, newPassword } = req.body;

  try {
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        error: { message: 'Old password and new password are required', status: 400 } 
      });
    }
    const [users] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: { message: 'User not found', status: 404 } 
      });
    }
    const passwordMatch = await bcrypt.compare(oldPassword, users[0].password);

    if (!passwordMatch) {
      return res.status(401).json({ 
        error: { message: 'Invalid old password', status: 401 } 
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to change password', status: 500 } 
    });
  }
});

router.post('/create-organizer-profile', verifyToken, async (req, res) => {
  const db = req.app.locals.db;
  const { organizer_name, phone, address, bio } = req.body;

  try {
    const [users] = await db.query(
      'SELECT id, username, email, full_name, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: { message: 'User not found', status: 404 } 
      });
    }

    const user = users[0];

    if (user.role !== 'organizer') {
      return res.status(403).json({ 
        error: { message: 'Only organizers can create organizer profiles', status: 403 } 
      });
    }

    const [existingOrganizers] = await db.query(
      'SELECT id FROM organizers WHERE user_id = ?',
      [req.user.id]
    );

    if (existingOrganizers.length > 0) {
      return res.status(409).json({ 
        error: { message: 'Organizer profile already exists', status: 409 } 
      });
    }

    const [result] = await db.query(
      `INSERT INTO organizers (user_id, organizer_name, contact_email, phone, address, bio, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        req.user.id,
        organizer_name || user.full_name || user.username,
        user.email,
        phone || null,
        address || null,
        bio || null
      ]
    );

    res.status(201).json({
      message: 'Organizer profile created successfully',
      organizer_id: result.insertId
    });

  } catch (err) {
    console.error('Create organizer profile error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to create organizer profile', status: 500 } 
    });
  }
});

module.exports = router;