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

    if (userRole === 'organizer') {
      if (!organizerData || !organizerData.name) {
        return res.status(400).json({ 
          error: { message: 'Organizer name is required', status: 400 } 
        });
      }
    }

    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        error: { message: 'Email hoặc tên đăng nhập đã tồn tại', status: 409 } 
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
        await db.query(
          'INSERT INTO organizers (name, email, phone, description, website, logo_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            organizerData.name,
            organizerData.email || email,
            organizerData.phone || phone || null,
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
        message: 'Đăng ký thành công',
        token,
        user: user[0]
      });

    } catch (err) {
      await db.query('ROLLBACK');
      console.error('Register transaction error:', err.message, '| Code:', err.code);
      throw err;
    }
  } catch (err) {
    console.error('Register error:', err.message, '| Code:', err.code);
    res.status(500).json({ 
      error: { message: 'Đăng ký thất bại: ' + err.message, status: 500 } 
    });
  }
});

router.post('/login', async (req, res) => {
  const db = req.app.locals.db;
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ 
        error: { message: 'Email và mật khẩu là bắt buộc', status: 400 } 
      });
    }

    const [users] = await db.query(
      'SELECT id, username, email, password, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: { message: 'Email hoặc mật khẩu không đúng', status: 401 } 
      });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ 
        error: { message: 'Email hoặc mật khẩu không đúng', status: 401 } 
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
      message: 'Đăng nhập thành công',
      token,
      user: userDetails[0]
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ 
      error: { message: 'Đăng nhập thất bại', status: 500 } 
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
        error: { message: 'Không tìm thấy người dùng', status: 404 } 
      });
    }

    res.json({ user: user[0] });
  } catch (err) {
    console.error('Get current user error:', err.message);
    res.status(500).json({ 
      error: { message: 'Lấy thông tin người dùng thất bại', status: 500 } 
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
      message: 'Cập nhật hồ sơ thành công',
      user: user[0]
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ 
      error: { message: 'Cập nhật hồ sơ thất bại', status: 500 } 
    });
  }
});

router.post('/change-password', verifyToken, async (req, res) => {
  const db = req.app.locals.db;
  const { oldPassword, newPassword } = req.body;

  try {
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        error: { message: 'Mật khẩu cũ và mới là bắt buộc', status: 400 } 
      });
    }

    const [users] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: { message: 'Không tìm thấy người dùng', status: 404 } 
      });
    }

    const passwordMatch = await bcrypt.compare(oldPassword, users[0].password);

    if (!passwordMatch) {
      return res.status(401).json({ 
        error: { message: 'Mật khẩu cũ không đúng', status: 401 } 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ 
      error: { message: 'Đổi mật khẩu thất bại', status: 500 } 
    });
  }
});

router.post('/create-organizer-profile', verifyToken, async (req, res) => {
  const db = req.app.locals.db;
  const { name, phone, description, website, logo_url } = req.body;

  try {
    const [users] = await db.query(
      'SELECT id, username, email, full_name, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: { message: 'Không tìm thấy người dùng', status: 404 } 
      });
    }

    const user = users[0];

    if (user.role !== 'organizer') {
      return res.status(403).json({ 
        error: { message: 'Chỉ tài khoản tổ chức mới có thể tạo hồ sơ tổ chức', status: 403 } 
      });
    }

    const [existingOrganizers] = await db.query(
      'SELECT id FROM organizers WHERE user_id = ?',
      [req.user.id]
    );

    if (existingOrganizers.length > 0) {
      return res.status(409).json({ 
        error: { message: 'Hồ sơ tổ chức đã tồn tại', status: 409 } 
      });
    }

    const [result] = await db.query(
      `INSERT INTO organizers (name, email, phone, description, website, logo_url, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name || user.full_name || user.username,
        user.email,
        phone || null,
        description || null,
        website || null,
        logo_url || null,
        req.user.id
      ]
    );

    res.status(201).json({
      message: 'Tạo hồ sơ tổ chức thành công',
      organizer_id: result.insertId
    });

  } catch (err) {
    console.error('Create organizer profile error:', err.message, '| Code:', err.code);
    res.status(500).json({ 
      error: { message: 'Tạo hồ sơ tổ chức thất bại: ' + err.message, status: 500 } 
    });
  }
});

module.exports = router;