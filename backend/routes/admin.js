const express = require('express');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, isAdmin);

router.get('/organizers', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { status = null } = req.query;
    let query = 'SELECT * FROM organizers';
    let params = [];

    if (status) {
      query += ' WHERE approval_status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [organizers] = await db.query(query, params);
    res.json({ organizers });
  } catch (err) {
    console.error('Get organizers error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to fetch organizers', status: 500 } 
    });
  }
});

router.get('/organizers/pending', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [organizers] = await db.query(
      'SELECT * FROM organizers WHERE approval_status = ? ORDER BY created_at ASC',
      ['pending']
    );
    res.json({ organizers });
  } catch (err) {
    console.error('Get pending organizers error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to fetch pending organizers', status: 500 } 
    });
  }
});

router.get('/organizers/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [organizers] = await db.query(
      `SELECT o.*, 
              u.username as approved_by_username, 
              u.email as approved_by_email
       FROM organizers o
       LEFT JOIN users u ON o.approved_by = u.id
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (organizers.length === 0) {
      return res.status(404).json({ 
        error: { message: 'Organizer not found', status: 404 } 
      });
    }

    res.json({ organizer: organizers[0] });
  } catch (err) {
    console.error('Get organizer error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to fetch organizer', status: 500 } 
    });
  }
});

router.post('/organizers/:id/approve', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const organizerId = req.params.id;
    const adminId = req.user.id;

    const [organizers] = await db.query(
      'SELECT * FROM organizers WHERE id = ?',
      [organizerId]
    );

    if (organizers.length === 0) {
      return res.status(404).json({ 
        error: { message: 'Organizer not found', status: 404 } 
      });
    }

    await db.query(
      `UPDATE organizers 
       SET approval_status = ?, approved_at = NOW(), approved_by = ?
       WHERE id = ?`,
      ['approved', adminId, organizerId]
    );

    const [updatedOrganizer] = await db.query(
      'SELECT * FROM organizers WHERE id = ?',
      [organizerId]
    );

    res.json({ 
      message: 'Organizer approved successfully',
      organizer: updatedOrganizer[0]
    });
  } catch (err) {
    console.error('Approve organizer error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to approve organizer', status: 500 } 
    });
  }
});

router.post('/organizers/:id/reject', async (req, res) => {
  const db = req.app.locals.db;
  const { reason } = req.body;

  try {
    const organizerId = req.params.id;
    const adminId = req.user.id;

    const [organizers] = await db.query(
      'SELECT * FROM organizers WHERE id = ?',
      [organizerId]
    );

    if (organizers.length === 0) {
      return res.status(404).json({ 
        error: { message: 'Organizer not found', status: 404 } 
      });
    }

    await db.query(
      `UPDATE organizers 
       SET approval_status = ?, rejection_reason = ?, approved_by = ?
       WHERE id = ?`,
      ['rejected', reason || null, adminId, organizerId]
    );

    const [updatedOrganizer] = await db.query(
      'SELECT * FROM organizers WHERE id = ?',
      [organizerId]
    );

    res.json({ 
      message: 'Organizer rejected successfully',
      organizer: updatedOrganizer[0]
    });
  } catch (err) {
    console.error('Reject organizer error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to reject organizer', status: 500 } 
    });
  }
});

router.get('/events', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const [events] = await db.query(`
      SELECT e.*, 
             v.name as venue_name, v.city,
             c.name as category_name,
             o.name as organizer_name, o.email as organizer_email
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      LEFT JOIN categories c ON e.category_id = c.id
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.status = ?
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `, [status, parseInt(limit), offset]);

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM events WHERE status = ?',
      [status]
    );

    res.json({
      events,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to fetch events', status: 500 } 
    });
  }
});

router.post('/events/:id/approve', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const eventId = req.params.id;
    const adminId = req.user.id;

    const [events] = await db.query(
      'SELECT * FROM events WHERE id = ?',
      [eventId]
    );

    if (events.length === 0) {
      return res.status(404).json({ 
        error: { message: 'Event not found', status: 404 } 
      });
    }

    await db.query(
      `UPDATE events 
       SET status = ?, approved_at = NOW(), approved_by = ?
       WHERE id = ?`,
      ['approved', adminId, eventId]
    );

    const [updatedEvent] = await db.query(`
      SELECT e.*, 
             v.name as venue_name, v.city,
             c.name as category_name,
             o.name as organizer_name
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      LEFT JOIN categories c ON e.category_id = c.id
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = ?
    `, [eventId]);

    res.json({ 
      message: 'Event approved successfully',
      event: updatedEvent[0]
    });
  } catch (err) {
    console.error('Approve event error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to approve event', status: 500 } 
    });
  }
});

router.post('/events/:id/reject', async (req, res) => {
  const db = req.app.locals.db;
  const { reason } = req.body;

  try {
    const eventId = req.params.id;
    const adminId = req.user.id;

    const [events] = await db.query(
      'SELECT * FROM events WHERE id = ?',
      [eventId]
    );

    if (events.length === 0) {
      return res.status(404).json({ 
        error: { message: 'Event not found', status: 404 } 
      });
    }

    await db.query(
      `UPDATE events 
       SET status = ?, rejection_reason = ?, approved_by = ?
       WHERE id = ?`,
      ['rejected', reason || null, adminId, eventId]
    );

    const [updatedEvent] = await db.query(`
      SELECT e.*, 
             v.name as venue_name, v.city,
             c.name as category_name,
             o.name as organizer_name
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      LEFT JOIN categories c ON e.category_id = c.id
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = ?
    `, [eventId]);

    res.json({ 
      message: 'Event rejected successfully',
      event: updatedEvent[0]
    });
  } catch (err) {
    console.error('Reject event error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to reject event', status: 500 } 
    });
  }
});

router.get('/dashboard/stats', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [pendingCount] = await db.query(
      'SELECT COUNT(*) as count FROM organizers WHERE approval_status = ?',
      ['pending']
    );

    const [approvedCount] = await db.query(
      'SELECT COUNT(*) as count FROM organizers WHERE approval_status = ?',
      ['approved']
    );

    const [rejectedCount] = await db.query(
      'SELECT COUNT(*) as count FROM organizers WHERE approval_status = ?',
      ['rejected']
    );

    const [pendingEventsCount] = await db.query(
      'SELECT COUNT(*) as count FROM events WHERE status = ?',
      ['pending']
    );

    const [approvedEventsCount] = await db.query(
      'SELECT COUNT(*) as count FROM events WHERE status = ?',
      ['approved']
    );

    const [totalBookingsCount] = await db.query(
      'SELECT COUNT(*) as count FROM bookings'
    );

    res.json({
      stats: {
        pendingOrganizers: pendingCount[0].count,
        approvedOrganizers: approvedCount[0].count,
        rejectedOrganizers: rejectedCount[0].count,
        pendingEvents: pendingEventsCount[0].count,
        approvedEvents: approvedEventsCount[0].count,
        totalBookings: totalBookingsCount[0].count
      }
    });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to fetch dashboard stats', status: 500 } 
    });
  }
});

module.exports = router;
