const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, adminAuth } = require('../middleware/auth');

// Đặt vé
router.post('/', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { event_id, quantity } = req.body;
    const user_id = req.user.id;

    // Kiểm tra sự kiện và số vé còn lại
    const [events] = await connection.query(
      'SELECT * FROM events WHERE id = ? AND status = "active"',
      [event_id]
    );

    if (events.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Sự kiện không tồn tại hoặc đã đóng' });
    }

    const event = events[0];

    if (event.available_tickets < quantity) {
      await connection.rollback();
      return res.status(400).json({ 
        message: 'Không đủ vé',
        available: event.available_tickets 
      });
    }

    const total_price = event.price * quantity;

    // Tạo booking
    const [result] = await connection.query(
      'INSERT INTO bookings (user_id, event_id, quantity, total_price) VALUES (?, ?, ?, ?)',
      [user_id, event_id, quantity, total_price]
    );

    // Cập nhật số vé còn lại
    await connection.query(
      'UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?',
      [quantity, event_id]
    );

    await connection.commit();

    res.status(201).json({ 
      message: 'Đặt vé thành công',
      bookingId: result.insertId,
      total_price 
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  } finally {
    connection.release();
  }
});

// Lấy danh sách booking của user
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, e.title, e.event_date, e.location, e.image_url 
       FROM bookings b 
       JOIN events e ON b.event_id = e.id 
       WHERE b.user_id = ? 
       ORDER BY b.booking_date DESC`,
      [req.user.id]
    );
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Lấy tất cả bookings (Admin only)
router.get('/all', auth, adminAuth, async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, u.username, u.email, e.title, e.event_date 
       FROM bookings b 
       JOIN users u ON b.user_id = u.id 
       JOIN events e ON b.event_id = e.id 
       ORDER BY b.booking_date DESC`
    );
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Hủy booking
router.put('/:id/cancel', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Lấy thông tin booking
    const [bookings] = await connection.query(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }

    const booking = bookings[0];

    if (booking.status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ message: 'Booking đã bị hủy' });
    }

    // Cập nhật trạng thái booking
    await connection.query(
      'UPDATE bookings SET status = "cancelled" WHERE id = ?',
      [req.params.id]
    );

    // Hoàn lại số vé
    await connection.query(
      'UPDATE events SET available_tickets = available_tickets + ? WHERE id = ?',
      [booking.quantity, booking.event_id]
    );

    await connection.commit();

    res.json({ message: 'Hủy vé thành công' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
