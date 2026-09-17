const db = require('../config/database');

// Get all events with live registration count and search/filter
async function getAllEvents(req, res) {
  try {
    const { search = '', category = '' } = req.query;

    let events;
    if (db.isFallback()) {
      events = db.getMockData().events.map(ev => {
        const confirmed = db.getMockData().registrations.filter(r => Number(r.event_id) === Number(ev.event_id) && r.status === 'confirmed').length;
        const waitlisted = db.getMockData().registrations.filter(r => Number(r.event_id) === Number(ev.event_id) && r.status === 'waitlisted').length;
        return {
          ...ev,
          registered_count: confirmed,
          waitlist_count: waitlisted,
          available_seats: Math.max(0, ev.capacity - confirmed),
          is_full: confirmed >= ev.capacity
        };
      });
    } else {
      const sql = `
        SELECT 
          e.*,
          COALESCE(COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END), 0) AS registered_count,
          COALESCE(COUNT(CASE WHEN r.status = 'waitlisted' THEN 1 END), 0) AS waitlist_count,
          GREATEST(0, e.capacity - COALESCE(COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END), 0)) AS available_seats,
          CASE WHEN COALESCE(COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END), 0) >= e.capacity THEN 1 ELSE 0 END AS is_full
        FROM events e
        LEFT JOIN registrations r ON e.event_id = r.event_id
        GROUP BY e.event_id
        ORDER BY e.date ASC, e.start_time ASC
      `;
      events = await db.query(sql);
    }

    // Filter by search query if present
    if (search.trim()) {
      const term = search.toLowerCase();
      events = events.filter(e => 
        e.event_name.toLowerCase().includes(term) ||
        (e.description && e.description.toLowerCase().includes(term)) ||
        e.venue.toLowerCase().includes(term)
      );
    }

    // Filter by category if present
    if (category && category !== 'All') {
      events = events.filter(e => e.category.toLowerCase() === category.toLowerCase());
    }

    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve events.' });
  }
}

// Get single event by ID
async function getEventById(req, res) {
  try {
    const { id } = req.params;
    let event;

    if (db.isFallback()) {
      const ev = db.getMockData().events.find(e => Number(e.event_id) === Number(id));
      if (ev) {
        const confirmed = db.getMockData().registrations.filter(r => Number(r.event_id) === Number(ev.event_id) && r.status === 'confirmed').length;
        const waitlisted = db.getMockData().registrations.filter(r => Number(r.event_id) === Number(ev.event_id) && r.status === 'waitlisted').length;
        event = {
          ...ev,
          registered_count: confirmed,
          waitlist_count: waitlisted,
          available_seats: Math.max(0, ev.capacity - confirmed),
          is_full: confirmed >= ev.capacity
        };
      }
    } else {
      const rows = await db.query(`
        SELECT 
          e.*,
          COALESCE(COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END), 0) AS registered_count,
          COALESCE(COUNT(CASE WHEN r.status = 'waitlisted' THEN 1 END), 0) AS waitlist_count,
          GREATEST(0, e.capacity - COALESCE(COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END), 0)) AS available_seats,
          CASE WHEN COALESCE(COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END), 0) >= e.capacity THEN 1 ELSE 0 END AS is_full
        FROM events e
        LEFT JOIN registrations r ON e.event_id = r.event_id
        WHERE e.event_id = ?
        GROUP BY e.event_id
      `, [id]);
      event = rows[0];
    }

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    res.json({ success: true, event });
  } catch (error) {
    console.error('Error fetching event by id:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve event.' });
  }
}

// Create new event (Admin only)
async function createEvent(req, res) {
  try {
    const {
      event_name,
      category,
      date,
      start_time,
      end_time,
      venue,
      capacity = 50,
      description = '',
      banner_image = ''
    } = req.body;

    if (!event_name || !category || !date || !start_time || !end_time || !venue) {
      return res.status(400).json({ success: false, message: 'All event details (name, category, date, timings, venue) are required.' });
    }

    const defaultBanner = banner_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';
    let newEvent;

    if (db.isFallback()) {
      const newId = db.getMockData().events.reduce((max, e) => Math.max(max, Number(e.event_id) || 0), 0) + 1;
      newEvent = {
        event_id: newId,
        event_name,
        category,
        date,
        start_time,
        end_time,
        venue,
        capacity: Number(capacity),
        description,
        banner_image: defaultBanner,
        created_by: req.user.user_id,
        registered_count: 0,
        waitlist_count: 0,
        available_seats: Number(capacity),
        is_full: false
      };
      db.getMockData().events.push(newEvent);
      if (db.saveStore) db.saveStore();
    } else {
      const result = await db.query(
        `INSERT INTO events (event_name, category, date, start_time, end_time, venue, capacity, description, banner_image, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [event_name, category, date, start_time, end_time, venue, capacity, description, defaultBanner, req.user.user_id]
      );
      newEvent = {
        event_id: result.insertId,
        event_name,
        category,
        date,
        start_time,
        end_time,
        venue,
        capacity: Number(capacity),
        description,
        banner_image: defaultBanner,
        created_by: req.user.user_id,
        registered_count: 0,
        waitlist_count: 0,
        available_seats: Number(capacity),
        is_full: false
      };
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      event: newEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: 'Failed to create event.' });
  }
}

// Update existing event (Admin only)
async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const {
      event_name,
      category,
      date,
      start_time,
      end_time,
      venue,
      capacity,
      description,
      banner_image
    } = req.body;

    if (db.isFallback()) {
      const idx = db.getMockData().events.findIndex(e => e.event_id === Number(id));
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }
      db.getMockData().events[idx] = {
        ...db.getMockData().events[idx],
        ...(event_name && { event_name }),
        ...(category && { category }),
        ...(date && { date }),
        ...(start_time && { start_time }),
        ...(end_time && { end_time }),
        ...(venue && { venue }),
        ...(capacity !== undefined && { capacity: Number(capacity) }),
        ...(description !== undefined && { description }),
        ...(banner_image && { banner_image })
      };
      if (db.saveStore) db.saveStore();
    } else {
      await db.query(
        `UPDATE events SET
          event_name = COALESCE(?, event_name),
          category = COALESCE(?, category),
          date = COALESCE(?, date),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          venue = COALESCE(?, venue),
          capacity = COALESCE(?, capacity),
          description = COALESCE(?, description),
          banner_image = COALESCE(?, banner_image)
        WHERE event_id = ?`,
        [event_name, category, date, start_time, end_time, venue, capacity, description, banner_image, id]
      );
    }

    res.json({ success: true, message: 'Event updated successfully.' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Failed to update event.' });
  }
}

// Delete event (Admin only)
async function deleteEvent(req, res) {
  try {
    const { id } = req.params;

    if (db.isFallback()) {
      const initialLength = db.getMockData().events.length;
      db.getMockData().events = db.getMockData().events.filter(e => e.event_id !== Number(id));
      db.getMockData().registrations = db.getMockData().registrations.filter(r => r.event_id !== Number(id));
      if (db.saveStore) db.saveStore();
      if (db.getMockData().events.length === initialLength) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }
    } else {
      const result = await db.query('DELETE FROM events WHERE event_id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }
    }

    res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event.' });
  }
}

// Smart Recommendation Engine (Rule-based matching)
async function getRecommendedEvents(req, res) {
  try {
    const userInterests = (req.user?.interests || 'AI, Cloud, Web').toLowerCase().split(',').map(s => s.trim());
    const userDept = (req.user?.department || 'CMPN').toLowerCase();

    let allEvents;
    if (db.isFallback()) {
      allEvents = db.getMockData().events.map(ev => {
        const confirmed = db.getMockData().registrations.filter(r => Number(r.event_id) === Number(ev.event_id) && r.status === 'confirmed').length;
        return {
          ...ev,
          registered_count: confirmed,
          available_seats: Math.max(0, ev.capacity - confirmed)
        };
      });
    } else {
      allEvents = await db.query(`
        SELECT e.*, COALESCE(COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END), 0) AS registered_count
        FROM events e
        LEFT JOIN registrations r ON e.event_id = r.event_id
        GROUP BY e.event_id
      `);
    }

    // Score events based on user interests and department match
    const scored = allEvents.map(event => {
      let score = 0;
      const haystack = `${event.event_name} ${event.category} ${event.description}`.toLowerCase();
      
      userInterests.forEach(interest => {
        if (interest && haystack.includes(interest)) {
          score += 3;
        }
      });

      if (userDept === 'cmpn' && (haystack.includes('devops') || haystack.includes('machine learning') || haystack.includes('hackathon'))) {
        score += 2;
      } else if (userDept === 'it' && (haystack.includes('web') || haystack.includes('cloud'))) {
        score += 2;
      }

      return {
        ...event,
        recommendation_score: score,
        recommendation_reason: score > 2 
          ? 'Recommended based on your tech interests & department profile' 
          : 'Trending college event'
      };
    });

    // Sort by recommendation score descending
    scored.sort((a, b) => b.recommendation_score - a.recommendation_score);

    res.json({
      success: true,
      recommendations: scored.slice(0, 3)
    });
  } catch (error) {
    console.error('Error in recommendations:', error);
    res.status(500).json({ success: false, message: 'Failed to compute recommendations.' });
  }
}

// Toggle freeze/close registrations for an event (Admin Granular Control)
async function toggleFreezeEvent(req, res) {
  try {
    const { id } = req.params;
    const { is_frozen } = req.body;

    let updatedEvent;
    if (db.isFallback()) {
      const ev = db.getMockData().events.find(e => e.event_id === Number(id));
      if (!ev) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }
      ev.is_frozen = is_frozen !== undefined ? !!is_frozen : !ev.is_frozen;
      updatedEvent = ev;
      if (db.saveStore) db.saveStore();
    } else {
      const rows = await db.query('SELECT * FROM events WHERE event_id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }
      const newStatus = is_frozen !== undefined ? (is_frozen ? 1 : 0) : (rows[0].is_frozen ? 0 : 1);
      await db.query('UPDATE events SET is_frozen = ? WHERE event_id = ?', [newStatus, id]);
      updatedEvent = { ...rows[0], is_frozen: !!newStatus };
    }

    res.json({
      success: true,
      message: `Registrations for "${updatedEvent.event_name}" are now ${updatedEvent.is_frozen ? 'CLOSED / FROZEN' : 'OPEN'}.`,
      is_frozen: !!updatedEvent.is_frozen
    });
  } catch (error) {
    console.error('Error toggling freeze:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle event registration status.' });
  }
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getRecommendedEvents,
  toggleFreezeEvent
};
