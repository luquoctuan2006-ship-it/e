const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, adminAuth } = require('../middleware/auth');

// Lấy tất cả sự kiện
router.get('/', async (req, res) => {
  try {
    const [events] = await db.query(
      'SELECT * FROM events WHERE status = "active" ORDER BY event_date ASC'
    );
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Lấy chi tiết sự kiện
router.get('/:id', async (req, res) => {
  try {
    const [events] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    
    if (events.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sự kiện' });
    }
    
    res.json(events[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Tạo sự kiện mới (Admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { title, description, event_date, location, total_tickets, price, image_url } = req.body;

    const [result] = await db.query(
      'INSERT INTO events (title, description, event_date, location, total_tickets, available_tickets, price, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, event_date, location, total_tickets, total_tickets, price, image_url]
    );

    res.status(201).json({ 
      message: 'Tạo sự kiện thành công',
      eventId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Cập nhật sự kiện (Admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { title, description, event_date, location, total_tickets, price, status, image_url } = req.body;

    await db.query(
      'UPDATE events SET title = ?, description = ?, event_date = ?, location = ?, total_tickets = ?, price = ?, status = ?, image_url = ? WHERE id = ?',
      [title, description, event_date, location, total_tickets, price, status, image_url, req.params.id]
    );

    res.json({ message: 'Cập nhật sự kiện thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Xóa sự kiện (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Xóa sự kiện thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

module.exports = router;