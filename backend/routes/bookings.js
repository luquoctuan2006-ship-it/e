const express = require('express');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/my-bookings', verifyToken, async (req, res) => {
  const db = req.app.locals.db;
  const { status, page = 1, limit = 10 } = req.query;

  try {
    let query = `
      SELECT b.*, 
             e.title as event_title, e.event_date, e.image_url as event_image,
             v.name as venue_name, v.address as venue_address, v.city
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      JOIN venues v ON e.venue_id = v.id
      WHERE b.user_id = ?
    `;
    
    const params = [req.user.id];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    query += ' ORDER BY b.booking_date DESC LIMIT ? OFFSET ?';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const [bookings] = await db.query(query, params);
    let countQuery = 'SELECT COUNT(*) as total FROM bookings WHERE user_id = ?';
    const countParams = [req.user.id];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await db.query(countQuery, countParams);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch bookings', status: 500 } });
  }
});
router.get('/', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { status, event_id, page = 1, limit = 20 } = req.query;

  try {
    let query = `
      SELECT b.*, 
             u.username, u.email, u.full_name,
             e.title as event_title, e.event_date
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN events e ON b.event_id = e.id
      WHERE 1=1
    `;
    
    const params = [];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    if (event_id) {
      query += ' AND b.event_id = ?';
      params.push(event_id);
    }

    query += ' ORDER BY b.booking_date DESC LIMIT ? OFFSET ?';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const [bookings] = await db.query(query, params);

    res.json({ bookings });
  } catch (err) {
    console.error('Get all bookings error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch bookings', status: 500 } });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    const [bookings] = await db.query(`
      SELECT b.*, 
             u.username, u.email, u.full_name, u.phone,
             e.title as event_title, e.description as event_description, e.event_date, e.image_url as event_image,
             v.name as venue_name, v.address as venue_address, v.city, v.map_url,
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN events e ON b.event_id = e.id
      JOIN venues v ON e.venue_id = v.id
      WHERE b.id = ?
    `, [id]);

    if (bookings.length === 0) {
      return res.status(404).json({ error: { message: 'Booking not found', status: 404 } });
    }

    const booking = bookings[0];

    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied', status: 403 } });
    }

    res.json({ booking });
  } catch (err) {
    console.error('Get booking error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch booking', status: 500 } });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const db = req.app.locals.db;
  const { event_id, quantity } = req.body;

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    if (!event_id || !quantity || quantity < 1) {
      await connection.rollback();
      return res.status(400).json({ error: { message: 'Invalid booking data', status: 400 } });
    }

    const [events] = await connection.query(
      'SELECT * FROM events WHERE id = ? AND status = "active" FOR UPDATE',
      [event_id]
    );

    if (events.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: { message: 'Event not found or not active', status: 404 } });
    }

    const event = events[0];
    if (new Date(event.event_date) < new Date()) {
      await connection.rollback();
      return res.status(400).json({ error: { message: 'Cannot book past events', status: 400 } });
    }
    if (event.available_tickets < quantity) {
      await connection.rollback();
      return res.status(400).json({ 
        error: { 
          message: `Only ${event.available_tickets} tickets available`, 
          status: 400,
          available: event.available_tickets
        } 
      });
    }
    const total_price = event.price * quantity;

    const [bookingResult] = await connection.query(
      'INSERT INTO bookings (user_id, event_id, quantity, total_price, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, event_id, quantity, total_price, 'pending']
    );

    await connection.query(
      'UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?',
      [quantity, event_id]
    );

    await connection.commit();

    const [newBooking] = await db.query(`
      SELECT b.*, 
             e.title as event_title, e.event_date, e.image_url as event_image,
             v.name as venue_name
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      JOIN venues v ON e.venue_id = v.id
      WHERE b.id = ?
    `, [bookingResult.insertId]);

    res.status(201).json({
      message: 'Booking created successfully',
      booking: newBooking[0]
    });
  } catch (err) {
    await connection.rollback();
    console.error('Create booking error:', err);
    res.status(500).json({ error: { message: 'Failed to create booking', status: 500 } });
  } finally {
    connection.release();
  }
});

router.put('/:id/cancel', verifyToken, async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [bookings] = await connection.query(
      'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
      [id]
    );

    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: { message: 'Booking not found', status: 404 } });
    }

    const booking = bookings[0];

    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ error: { message: 'Access denied', status: 403 } });
    }

    if (booking.status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ error: { message: 'Booking already cancelled', status: 400 } });
    }

    await connection.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      ['cancelled', id]
    );

    await connection.query(
      'UPDATE events SET available_tickets = available_tickets + ? WHERE id = ?',
      [booking.quantity, booking.event_id]
    );

    await connection.commit();

    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: { message: 'Failed to cancel booking', status: 500 } });
  } finally {
    connection.release();
  }
});

router.get('/stats/overview', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
        SUM(total_price) as total_revenue,
        SUM(CASE WHEN status = 'confirmed' THEN total_price ELSE 0 END) as confirmed_revenue
      FROM bookings
    `);

    res.json({ stats: stats[0] });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: { message: 'Failed to fetch statistics', status: 500 } });
  }
});

module.exports = router;