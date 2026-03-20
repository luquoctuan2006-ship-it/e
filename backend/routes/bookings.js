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

    // Fetch ticket details for each booking
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const [ticketDetails] = await db.query(`
          SELECT 
            tb.id,
            tb.ticket_type_id,
            tb.quantity,
            tb.price_per_ticket,
            tb.subtotal,
            tt.name as ticket_type_name
          FROM ticket_bookings tb
          JOIN ticket_types tt ON tb.ticket_type_id = tt.id
          WHERE tb.booking_id = ?
        `, [booking.id]);

        // Parse seats if they are JSON
        let seats = booking.seats;
        if (seats) {
          try {
            seats = typeof seats === 'string' ? JSON.parse(seats) : seats;
          } catch (e) {
            seats = null;
          }
        }

        return {
          ...booking,
          seats,
          ticket_details: ticketDetails
        };
      })
    );

    let countQuery = 'SELECT COUNT(*) as total FROM bookings WHERE user_id = ?';
    const countParams = [req.user.id];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await db.query(countQuery, countParams);

    res.json({
      bookings: bookingsWithDetails,
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
  const { event_id, quantity, ticket_details } = req.body;

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    if (!event_id) {
      await connection.rollback();
      return res.status(400).json({ error: { message: 'Missing event_id', status: 400 } });
    }

    const [events] = await connection.query(
      // allow booking when admin has approved the event (status may be 'approved' or 'active')
      'SELECT * FROM events WHERE id = ? AND status IN ("approved","active") FOR UPDATE',
      [event_id]
    );

    if (events.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: { message: 'Event not found or not available for booking', status: 404 } });
    }
    const event = events[0];
    if (new Date(event.event_date) < new Date()) {
      await connection.rollback();
      return res.status(400).json({ error: { message: 'Cannot book past events', status: 400 } });
    }

    let total_price = 0;
    let total_quantity = 0;

    if (ticket_details && Array.isArray(ticket_details) && ticket_details.length > 0) {
      // Booking with ticket types
      for (const detail of ticket_details) {
        const { ticket_type_id, quantity: ticketQty } = detail;

        if (!ticket_type_id || ticketQty < 1) {
          await connection.rollback();
          return res.status(400).json({ error: { message: 'Invalid ticket details', status: 400 } });
        }

        const [ticketTypes] = await connection.query(
          'SELECT * FROM ticket_types WHERE id = ? AND event_id = ? FOR UPDATE',
          [ticket_type_id, event_id]
        );

        if (ticketTypes.length === 0) {
          await connection.rollback();
          return res.status(404).json({ error: { message: 'Ticket type not found', status: 404 } });
        }

        const ticketType = ticketTypes[0];
        if (ticketType.available_quantity < ticketQty) {
          await connection.rollback();
          return res.status(400).json({
            error: {
              message: `Only ${ticketType.available_quantity} tickets of type "${ticketType.name}" available`,
              status: 400
            }
          });
        }

        total_price += ticketType.price * ticketQty;
        total_quantity += ticketQty;

        await connection.query(
          'UPDATE ticket_types SET available_quantity = available_quantity - ? WHERE id = ?',
          [ticketQty, ticket_type_id]
        );
      }
    } else if (quantity && quantity >= 1) {
      // Regular booking without ticket types
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

      total_price = event.price * quantity;
      total_quantity = quantity;

      await connection.query(
        'UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?',
        [quantity, event_id]
      );
    } else {
      await connection.rollback();
      return res.status(400).json({ error: { message: 'Missing quantity or ticket_details', status: 400 } });
    }

    const [bookingResult] = await connection.query(
      'INSERT INTO bookings (user_id, event_id, quantity, total_price, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, event_id, total_quantity, total_price, 'pending']
    );

    // Insert ticket booking details if applicable
    if (ticket_details && Array.isArray(ticket_details) && ticket_details.length > 0) {
      for (const detail of ticket_details) {
        const [ticketType] = await connection.query(
          'SELECT price FROM ticket_types WHERE id = ?',
          [detail.ticket_type_id]
        );

        if (ticketType.length > 0) {
          const subtotal = ticketType[0].price * detail.quantity;
          await connection.query(
            'INSERT INTO ticket_bookings (booking_id, ticket_type_id, quantity, price_per_ticket, subtotal) VALUES (?, ?, ?, ?, ?)',
            [bookingResult.insertId, detail.ticket_type_id, detail.quantity, ticketType[0].price, subtotal]
          );
        }
      }
    }

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

    // Delete the booking from database instead of just marking as cancelled
    await connection.query(
      'DELETE FROM bookings WHERE id = ?',
      [id]
    );

    // Release tickets back to the event
    await connection.query(
      'UPDATE events SET available_tickets = available_tickets + ? WHERE id = ?',
      [booking.quantity, booking.event_id]
    );

    await connection.commit();

    res.json({ message: 'Booking cancelled and deleted successfully' });
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

// Organizer Routes
const isOrganizer = (req, res, next) => {
  if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
    return res.status(403).json({
      error: {
        message: 'Access denied. Organizer role required',
        status: 403
      }
    });
  }
  next();
};

router.get('/organizer/event/:eventId', verifyToken, isOrganizer, async (req, res) => {
  const db = req.app.locals.db;
  const { eventId } = req.params;

  try {
    // Verify organizer ownership
    const [event] = await db.query(
      'SELECT organizer_id FROM events WHERE id = ?',
      [eventId]
    );

    if (event.length === 0) {
      return res.status(404).json({
        error: { message: 'Event not found', status: 404 }
      });
    }

    // Check organizer permission if not admin
    if (req.user.role !== 'admin') {
      const [organizer] = await db.query(
        'SELECT id FROM organizers WHERE user_id = ?',
        [req.user.id]
      );

      if (!organizer.length || organizer[0].id !== event[0].organizer_id) {
        return res.status(403).json({
          error: { message: 'Access denied', status: 403 }
        });
      }
    }

    // Get all bookings for the event with ticket details
    const [bookings] = await db.query(`
      SELECT 
        b.*,
        u.username, u.email, u.full_name, u.phone,
        e.title as event_title, e.event_date
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN events e ON b.event_id = e.id
      WHERE b.event_id = ?
      ORDER BY b.booking_date DESC
    `, [eventId]);

    // Get ticket details for each booking
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        const [ticketDetails] = await db.query(`
          SELECT 
            tb.id,
            tb.ticket_type_id,
            tb.quantity,
            tb.price_per_ticket,
            tb.subtotal,
            tt.name as ticket_type_name
          FROM ticket_bookings tb
          JOIN ticket_types tt ON tb.ticket_type_id = tt.id
          WHERE tb.booking_id = ?
        `, [booking.id]);

        // Parse seats if they are JSON
        let seats = booking.seats;
        if (seats) {
          try {
            seats = typeof seats === 'string' ? JSON.parse(seats) : seats;
          } catch (e) {
            seats = null;
          }
        }

        return {
          ...booking,
          seats,
          ticket_details: ticketDetails
        };
      })
    );

    res.json({ bookings: bookingsWithDetails });
  } catch (err) {
    console.error('Get event bookings error:', err);
    res.status(500).json({
      error: { message: 'Failed to fetch bookings', status: 500 }
    });
  }
});

router.put('/:id/approve', verifyToken, isOrganizer, async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { seats, notes } = req.body;

  try {
    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        error: { message: 'Seats must be provided as an array', status: 400 }
      });
    }

    // Get booking and verify organizer ownership
    const [booking] = await db.query(
      `SELECT b.*, e.organizer_id FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE b.id = ?`,
      [id]
    );

    if (booking.length === 0) {
      return res.status(404).json({
        error: { message: 'Booking not found', status: 404 }
      });
    }

    // Check organizer permission if not admin
    if (req.user.role !== 'admin') {
      const [organizer] = await db.query(
        'SELECT id FROM organizers WHERE user_id = ?',
        [req.user.id]
      );

      if (!organizer.length || organizer[0].id !== booking[0].organizer_id) {
        return res.status(403).json({
          error: { message: 'Access denied', status: 403 }
        });
      }
    }

    const seatsJson = JSON.stringify(seats);
    const approvedAt = new Date();
    const approvedBy = req.user.id;

    await db.query(
      `UPDATE bookings 
       SET status = 'approved', seats = ?, notes = ?, approved_at = ?, approved_by = ?
       WHERE id = ?`,
      [seatsJson, notes || null, approvedAt, approvedBy, id]
    );

    res.json({
      message: 'Booking approved successfully',
      booking: {
        id,
        status: 'approved',
        seats,
        notes: notes || null,
        approved_at: approvedAt,
        approved_by: approvedBy
      }
    });
  } catch (err) {
    console.error('Approve booking error:', err);
    res.status(500).json({
      error: { message: 'Failed to approve booking', status: 500 }
    });
  }
});

router.put('/:id/reject', verifyToken, isOrganizer, async (req, res) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    // Get booking and verify organizer ownership
    const [booking] = await db.query(
      `SELECT b.*, e.organizer_id FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE b.id = ?`,
      [id]
    );

    if (booking.length === 0) {
      return res.status(404).json({
        error: { message: 'Booking not found', status: 404 }
      });
    }

    // Check organizer permission if not admin
    if (req.user.role !== 'admin') {
      const [organizer] = await db.query(
        'SELECT id FROM organizers WHERE user_id = ?',
        [req.user.id]
      );

      if (!organizer.length || organizer[0].id !== booking[0].organizer_id) {
        return res.status(403).json({
          error: { message: 'Access denied', status: 403 }
        });
      }
    }

    await db.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      ['cancelled', id]
    );

    res.json({
      message: 'Booking rejected successfully',
      booking: {
        id,
        status: 'cancelled'
      }
    });
  } catch (err) {
    console.error('Reject booking error:', err);
    res.status(500).json({
      error: { message: 'Failed to reject booking', status: 500 }
    });
  }
});

module.exports = router;