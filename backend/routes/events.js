const express = require('express');
const { verifyToken, isAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();



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

router.post('/organizer/create', verifyToken, isOrganizer, async (req, res) => {
  const db = req.app.locals.db;

  const { 
    title, 
    description, 
    event_date, 
    venue_id, 
    total_tickets, 
    price, 
    image_url, 
    category_id,
    ticket_types
  } = req.body;

  try {
    if (!title || !event_date || !venue_id || !total_tickets || price === undefined) {
      return res.status(400).json({ 
        error: { 
          message: 'Missing required fields: title, event_date, venue_id, total_tickets, price', 
          status: 400 
        } 
      });
    }
    
    let [organizerCheck] = await db.query(
      'SELECT id FROM organizers WHERE user_id = ?',
      [req.user.id]
    );

    let organizer_id;

    if (organizerCheck.length === 0) {
      try {
        const [newOrganizerResult] = await db.query(
          'INSERT INTO organizers (name, email, user_id) VALUES (?, ?, ?)',
          [req.user.username || 'Default Organizer', req.user.email, req.user.id]
        );
        organizer_id = newOrganizerResult.insertId;
      } catch (err) {
        console.error('Error creating organizer profile:', err);
        return res.status(500).json({ 
          error: { 
            message: 'Failed to create organizer profile', 
            status: 500 
          } 
        });
      }
    } else {
      organizer_id = organizerCheck[0].id;
    }

    const [result] = await db.query(`
      INSERT INTO events 
      (title, description, event_date, venue_id, total_tickets, 
       available_tickets, price, image_url, category_id, organizer_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      title, 
      description || null, 
      event_date, 
      venue_id, 
      total_tickets,
      total_tickets, 
      price, 
      image_url || null, 
      category_id || null,
      organizer_id 
    ]);


    const [event] = await db.query(`
      SELECT e.*, 
             v.name as venue_name, v.city,
             c.name as category_name,
             o.name as organizer_name
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = ?
    `, [result.insertId]);

    if (ticket_types && Array.isArray(ticket_types) && ticket_types.length > 0) {
      for (const ticketType of ticket_types) {
        await db.query(
          `INSERT INTO ticket_types (event_id, name, description, price, quantity, available_quantity)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            result.insertId,
            ticketType.name,
            ticketType.description || null,
            ticketType.price,
            ticketType.quantity,
            ticketType.quantity
          ]
        );
      }
    }

    res.status(201).json({
      message: 'Event created successfully. Waiting for admin approval.',
      event: event[0]
    });
  } catch (err) {
    console.error('Organizer create event error:', err);
    

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        error: { 
          message: 'Invalid venue_id, category_id, or organizer_id', 
          status: 400 
        } 
      });
    }
    
    res.status(500).json({ 
      error: { 
        message: 'Failed to create event', 
        status: 500 
      } 
    });
  }
});


router.get('/organizer/details/:id', verifyToken, isOrganizer, async (req, res) => {
  const db = req.app.locals.db;
  const eventId = req.params.id;

  try {
    let [organizerResult] = await db.query(
      'SELECT id FROM organizers WHERE user_id = ?',
      [req.user.id]
    );

    let organizerId;

    if (organizerResult.length === 0) {
      try {
        const [newOrganizerResult] = await db.query(
          'INSERT INTO organizers (name, email, user_id) VALUES (?, ?, ?)',
          [req.user.username || 'Default Organizer', req.user.email, req.user.id]
        );
        organizerId = newOrganizerResult.insertId;
      } catch (err) {
        console.error('Error creating organizer profile:', err);
        return res.status(500).json({ 
          error: { 
            message: 'Failed to create organizer profile', 
            status: 500 
          } 
        });
      }
    } else {
      organizerId = organizerResult[0].id;
    }

    const [events] = await db.query(`
      SELECT e.* 
      FROM events e
      WHERE e.id = ? AND e.organizer_id = ?
    `, [eventId, organizerId]);

    if (events.length === 0) {
      return res.status(404).json({ 
        error: { 
          message: 'Event not found or you do not have permission to edit it', 
          status: 404 
        } 
      });
    }

    res.json({ event: events[0] });
  } catch (err) {
    console.error('Get organizer event details error:', err);
    res.status(500).json({ 
      error: { 
        message: 'Failed to fetch event details', 
        status: 500 
      } 
    });
  }
});

router.put('/organizer/update/:id', verifyToken, isOrganizer, async (req, res) => {
  const db = req.app.locals.db;
  const eventId = req.params.id;
  const { title, description, event_date, venue_id, price, image_url, category_id } = req.body;

  try {
    let [organizerResult] = await db.query(
      'SELECT id FROM organizers WHERE user_id = ?',
      [req.user.id]
    );

    let organizerId;

    if (organizerResult.length === 0) {
      try {
        const [newOrganizerResult] = await db.query(
          'INSERT INTO organizers (name, email, user_id) VALUES (?, ?, ?)',
          [req.user.username || 'Default Organizer', req.user.email, req.user.id]
        );
        organizerId = newOrganizerResult.insertId;
      } catch (err) {
        console.error('Error creating organizer profile:', err);
        return res.status(500).json({ 
          error: { 
            message: 'Failed to create organizer profile', 
            status: 500 
          } 
        });
      }
    } else {
      organizerId = organizerResult[0].id;
    }

    const [checkEvent] = await db.query(
      'SELECT id FROM events WHERE id = ? AND organizer_id = ?',
      [eventId, organizerId]
    );

    if (checkEvent.length === 0) {
      return res.status(403).json({ 
        error: { 
          message: 'You do not have permission to edit this event', 
          status: 403 
        } 
      });
    }

    if (!title || !event_date || !venue_id || price === undefined) {
      return res.status(400).json({ 
        error: { 
          message: 'Missing required fields: title, event_date, venue_id, price', 
          status: 400 
        } 
      });
    }

    await db.query(`
      UPDATE events 
      SET title = ?, description = ?, event_date = ?, venue_id = ?, price = ?, image_url = ?, category_id = ?
      WHERE id = ? AND organizer_id = ?
    `, [title, description || null, event_date, venue_id, price, image_url || null, category_id || null, eventId, organizerId]);

    const [event] = await db.query(`
      SELECT e.*, 
             v.name as venue_name, v.city,
             c.name as category_name,
             o.name as organizer_name
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = ?
    `, [eventId]);

    res.json({
      message: 'Event updated successfully',
      event: event[0]
    });
  } catch (err) {
    console.error('Update organizer event error:', err);
    
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        error: { 
          message: 'Invalid venue_id or category_id', 
          status: 400 
        } 
      });
    }
    
    res.status(500).json({ 
      error: { 
        message: 'Failed to update event', 
        status: 500 
      } 
    });
  }
});

router.get('/organizer/my-events', verifyToken, isOrganizer, async (req, res) => {
  const db = req.app.locals.db;
  const { status, page = 1, limit = 10 } = req.query;

  try {
    let [organizerResult] = await db.query(
      'SELECT id FROM organizers WHERE user_id = ?',
      [req.user.id]
    );

    let organizerId;

    if (organizerResult.length === 0) {
      try {
        const [newOrganizerResult] = await db.query(
          'INSERT INTO organizers (name, email, user_id) VALUES (?, ?, ?)',
          [req.user.username || 'Default Organizer', req.user.email, req.user.id]
        );
        organizerId = newOrganizerResult.insertId;
      } catch (err) {
        console.error('Error creating organizer profile:', err);
        return res.status(500).json({ 
          error: { 
            message: 'Failed to create organizer profile', 
            status: 500 
          } 
        });
      }
    } else {
      organizerId = organizerResult[0].id;
    }

    let query = `
      SELECT e.*, 
             v.name as venue_name, v.city,
             c.name as category_name,
             COUNT(DISTINCT b.id) as total_bookings,
             COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'approved') THEN b.quantity ELSE 0 END), 0) as sold_tickets,
             COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'approved') THEN b.total_price ELSE 0 END), 0) as total_revenue
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN bookings b ON e.id = b.event_id
      WHERE e.organizer_id = ?
    `;

    const params = [organizerId];

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    query += ' GROUP BY e.id ORDER BY e.created_at DESC';


    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [events] = await db.query(query, params);


    let countQuery = `SELECT COUNT(*) as total FROM events WHERE organizer_id = ?`;
    const countParams = [organizerId];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await db.query(countQuery, countParams);

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
    console.error('Get organizer events error:', err);
    res.status(500).json({ 
      error: { 
        message: 'Failed to fetch organizer events', 
        status: 500 
      } 
    });
  }
});

router.get('/venues/list', optionalAuth, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [venues] = await db.query(`
      SELECT id, name, city, address, capacity
      FROM venues
      ORDER BY city, name
    `);

    res.json({ venues });
  } catch (err) {
    console.error('Get venues list error:', err);
    res.status(500).json({ 
      error: { 
        message: 'Failed to fetch venues', 
        status: 500 
      } 
    });
  }
});

router.get('/categories/list', optionalAuth, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [categories] = await db.query(`
      SELECT id, name, slug, description
      FROM categories
      ORDER BY name
    `);

    res.json({ categories });
  } catch (err) {
    console.error('Get categories list error:', err);
    res.status(500).json({ 
      error: { 
        message: 'Failed to fetch categories', 
        status: 500 
      } 
    });
  }
});

router.get('/', optionalAuth, async (req, res) => {
  const db = req.app.locals.db;
  const { category_id, venue_id, city, search, page = 1, limit = 10, sort = 'date' } = req.query;

  try {
    let query = `
      SELECT e.*, 
             v.name as venue_name, v.city, v.capacity,
             c.name as category_name,
             o.name as organizer_name, o.email as organizer_email,
             COUNT(DISTINCT b.id) as total_bookings
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      JOIN categories c ON e.category_id = c.id
      JOIN organizers o ON e.organizer_id = o.id
      LEFT JOIN bookings b ON e.id = b.event_id
      WHERE e.status = 'approved'
    `;

    const params = [];

    if (category_id) {
      query += ' AND e.category_id = ?';
      params.push(category_id);
    }

    if (venue_id) {
      query += ' AND e.venue_id = ?';
      params.push(venue_id);
    }

    if (city) {
      query += ' AND v.city = ?';
      params.push(city);
    }

    if (search) {
      query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY e.id';


    if (sort === 'popularity') {
      query += ' ORDER BY total_bookings DESC';
    } else if (sort === 'price_low') {
      query += ' ORDER BY e.price ASC';
    } else if (sort === 'price_high') {
      query += ' ORDER BY e.price DESC';
    } else {
      query += ' ORDER BY e.event_date ASC';
    }


    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [events] = await db.query(query, params);

    let countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      WHERE e.status = 'approved'
    `;
    const countParams = [];

    if (category_id) {
      countQuery += ' AND e.category_id = ?';
      countParams.push(category_id);
    }
    if (venue_id) {
      countQuery += ' AND e.venue_id = ?';
      countParams.push(venue_id);
    }
    if (city) {
      countQuery += ' AND v.city = ?';
      countParams.push(city);
    }
    if (search) {
      countQuery += ' AND (e.title LIKE ? OR e.description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(countQuery, countParams);

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

router.get('/upcoming', optionalAuth, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [events] = await db.query(`
      SELECT e.*, 
             v.name as venue_name, v.city,
             c.name as category_name
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      JOIN categories c ON e.category_id = c.id
      WHERE e.event_date >= NOW() AND e.status = 'approved'
      ORDER BY e.event_date ASC
      LIMIT 10
    `);

    res.json({ events });
  } catch (err) {
    console.error('Get upcoming events error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to fetch upcoming events', status: 500 } 
    });
  }
});


router.get('/:id', optionalAuth, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [events] = await db.query(`
      SELECT e.*, 
             v.name as venue_name, v.address as venue_address, v.city, v.capacity, v.amenities,
             c.name as category_name,
             o.name as organizer_name, o.email as organizer_email,
             COUNT(DISTINCT b.id) as total_bookings
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      JOIN categories c ON e.category_id = c.id
      JOIN organizers o ON e.organizer_id = o.id
      LEFT JOIN bookings b ON e.id = b.event_id
      WHERE e.id = ?
      GROUP BY e.id
    `, [req.params.id]);

    if (events.length === 0) {
      return res.status(404).json({ 
        error: { message: 'Event not found', status: 404 } 
      });
    }

    const event = events[0];
    
    const isOrganizerOrAdmin = req.user && (req.user.role === 'admin' || req.user.organizer_id === event.organizer_id);
    
    if (event.status !== 'approved' && !isOrganizerOrAdmin) {
      return res.status(404).json({ 
        error: { message: 'Event not found', status: 404 } 
      });
    }

    res.json({
      event
    });
  } catch (err) {
    console.error('Get event error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to fetch event', status: 500 } 
    });
  }
});


router.post('/', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { title, description, event_date, category_id, venue_id, organizer_id, price, image_url, available_tickets } = req.body;

  try {
    if (!title || !event_date || !category_id || !venue_id || !organizer_id || price === undefined) {
      return res.status(400).json({ 
        error: { message: 'Missing required fields', status: 400 } 
      });
    }

    const [result] = await db.query(`
      INSERT INTO events (title, description, event_date, category_id, venue_id, organizer_id, price, image_url, available_tickets)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description || null, event_date, category_id, venue_id, organizer_id, price, image_url || null, available_tickets || 0]);

    const [event] = await db.query(`
      SELECT e.*, 
             v.name as venue_name, v.city,
             c.name as category_name,
             o.name as organizer_name
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      JOIN categories c ON e.category_id = c.id
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Event created successfully',
      event: event[0]
    });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to create event', status: 500 } 
    });
  }
});


router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { title, description, event_date, category_id, venue_id, organizer_id, price, image_url, available_tickets } = req.body;

  try {
    await db.query(`
      UPDATE events 
      SET title = ?, description = ?, event_date = ?, category_id = ?, venue_id = ?, organizer_id = ?, price = ?, image_url = ?, available_tickets = ?
      WHERE id = ?
    `, [title, description || null, event_date, category_id, venue_id, organizer_id, price, image_url || null, available_tickets || 0, req.params.id]);

    const [event] = await db.query(`
      SELECT e.*, 
             v.name as venue_name, v.city,
             c.name as category_name,
             o.name as organizer_name
      FROM events e
      JOIN venues v ON e.venue_id = v.id
      JOIN categories c ON e.category_id = c.id
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = ?
    `, [req.params.id]);

    res.json({
      message: 'Event updated successfully',
      event: event[0]
    });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to update event', status: 500 } 
    });
  }
});

router.get('/:id/ticket-types', optionalAuth, async (req, res) => {
  const db = req.app.locals.db;

  try {
    const [ticketTypes] = await db.query(
      'SELECT * FROM ticket_types WHERE event_id = ? ORDER BY id',
      [req.params.id]
    );

    res.json({ 
      ticket_types: ticketTypes 
    });
  } catch (err) {
    console.error('Get ticket types error:', err);
    res.status(500).json({ 
      error: { message: 'Failed to get ticket types', status: 500 } 
    });
  }
});

router.post('/:id/ticket-types', verifyToken, isOrganizer, async (req, res) => {
  const db = req.app.locals.db;
  const { name, description, price, quantity } = req.body;
  const eventId = req.params.id;

  try {
    if (!name || price === undefined || !quantity) {
      return res.status(400).json({
        error: {
          message: 'Missing required fields: name, price, quantity',
          status: 400
        }
      });
    }

    const [event] = await db.query(
      'SELECT organizer_id FROM events WHERE id = ?',
      [eventId]
    );

    if (event.length === 0) {
      return res.status(404).json({
        error: { message: 'Event not found', status: 404 }
      });
    }

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

    const [result] = await db.query(
      `INSERT INTO ticket_types (event_id, name, description, price, quantity, available_quantity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [eventId, name, description || null, price, quantity, quantity]
    );

    res.status(201).json({
      message: 'Ticket type created successfully',
      ticket_type: {
        id: result.insertId,
        event_id: eventId,
        name,
        description,
        price,
        quantity,
        available_quantity: quantity
      }
    });
  } catch (err) {
    console.error('Create ticket type error:', err);
    res.status(500).json({
      error: { message: 'Failed to create ticket type', status: 500 }
    });
  }
});

router.put('/ticket-types/:ticketTypeId', verifyToken, isOrganizer, async (req, res) => {
  const db = req.app.locals.db;
  const { name, description, price, quantity } = req.body;
  const ticketTypeId = req.params.ticketTypeId;

  try {
    const [ticketType] = await db.query(
      `SELECT tt.*, e.organizer_id FROM ticket_types tt
       JOIN events e ON tt.event_id = e.id
       WHERE tt.id = ?`,
      [ticketTypeId]
    );

    if (ticketType.length === 0) {
      return res.status(404).json({
        error: { message: 'Ticket type not found', status: 404 }
      });
    }

    if (req.user.role !== 'admin') {
      const [organizer] = await db.query(
        'SELECT id FROM organizers WHERE user_id = ?',
        [req.user.id]
      );

      if (!organizer.length || organizer[0].id !== ticketType[0].organizer_id) {
        return res.status(403).json({
          error: { message: 'Access denied', status: 403 }
        });
      }
    }

    await db.query(
      `UPDATE ticket_types SET name = ?, description = ?, price = ?, quantity = ? WHERE id = ?`,
      [name || ticketType[0].name, description, price, quantity, ticketTypeId]
    );

    res.json({ message: 'Ticket type updated successfully' });
  } catch (err) {
    console.error('Update ticket type error:', err);
    res.status(500).json({
      error: { message: 'Failed to update ticket type', status: 500 }
    });
  }
});

router.delete('/ticket-types/:ticketTypeId', verifyToken, isOrganizer, async (req, res) => {
  const db = req.app.locals.db;
  const ticketTypeId = req.params.ticketTypeId;

  try {
    const [ticketType] = await db.query(
      `SELECT tt.*, e.organizer_id FROM ticket_types tt
       JOIN events e ON tt.event_id = e.id
       WHERE tt.id = ?`,
      [ticketTypeId]
    );

    if (ticketType.length === 0) {
      return res.status(404).json({
        error: { message: 'Ticket type not found', status: 404 }
      });
    }

    if (req.user.role !== 'admin') {
      const [organizer] = await db.query(
        'SELECT id FROM organizers WHERE user_id = ?',
        [req.user.id]
      );

      if (!organizer.length || organizer[0].id !== ticketType[0].organizer_id) {
        return res.status(403).json({
          error: { message: 'Access denied', status: 403 }
        });
      }
    }

    await db.query('DELETE FROM ticket_types WHERE id = ?', [ticketTypeId]);
    res.json({ message: 'Ticket type deleted successfully' });
  } catch (err) {
    console.error('Delete ticket type error:', err);
    res.status(500).json({
      error: { message: 'Failed to delete ticket type', status: 500 }
    });
  }
});


module.exports = router;