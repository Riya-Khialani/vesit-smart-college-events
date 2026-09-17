const db = require('../config/database');

// Helper to convert "HH:MM:SS" or "HH:MM" to total minutes from midnight for accurate comparison
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.toString().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

// Check time overlap between two time windows on the same date
function hasTimeConflict(startA, endA, startB, endB) {
  const minStartA = timeToMinutes(startA);
  const minEndA = timeToMinutes(endA);
  const minStartB = timeToMinutes(startB);
  const minEndB = timeToMinutes(endB);

  // Overlap condition: StartA < EndB && EndA > StartB
  return minStartA < minEndB && minEndA > minStartB;
}

// Generate unique QR token
function generateQRToken(eventId, userId) {
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `QR-EVT${eventId}-USR${userId}-${randomSuffix}`;
}

// 1. Register for an Event with Conflict Detection & Waitlist Queue
async function registerForEvent(req, res) {
  try {
    const userId = req.user.user_id;
    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ success: false, message: 'Event ID is required.' });
    }

    // Role check: Only students/attendees can register for events
    if (req.user.role === 'admin' || req.user.role === 'scanner') {
      return res.status(403).json({
        success: false,
        message: 'Event staff and administrators cannot register for tickets. Please switch to a Student account (e.g. Riya) to reserve tickets.'
      });
    }

    // Step A: Fetch target event details
    let targetEvent;
    if (db.isFallback()) {
      targetEvent = db.getMockData().events.find(e => e.event_id === Number(event_id));
    } else {
      const rows = await db.query('SELECT * FROM events WHERE event_id = ?', [event_id]);
      targetEvent = rows[0];
    }

    if (!targetEvent) {
      return res.status(404).json({ success: false, message: 'Event does not exist.' });
    }

    // Granular Control: Check if event registration is frozen/closed by admin
    if (targetEvent.is_frozen) {
      return res.status(400).json({
        success: false,
        message: '⛔ Registrations for this event have been closed/frozen by the administration.'
      });
    }

    // Step B: Check if already registered
    let existingUserReg;
    if (db.isFallback()) {
      existingUserReg = db.getMockData().registrations.find(
        r => Number(r.user_id) === Number(userId) && Number(r.event_id) === Number(event_id) && r.status !== 'cancelled'
      );
    } else {
      const rows = await db.query(
        'SELECT * FROM registrations WHERE user_id = ? AND event_id = ? AND status != "cancelled"',
        [userId, event_id]
      );
      existingUserReg = rows[0];
    }

    if (existingUserReg) {
      return res.status(400).json({
        success: false,
        message: existingUserReg.status === 'waitlisted'
          ? `You are already on the waitlist (Position #${existingUserReg.waitlist_position}) for this event.`
          : 'You are already registered for this event!'
      });
    }

    // Step C: 🚨 SMART SCHEDULE CONFLICT DETECTION ALGORITHM 🚨
    let userExistingRegistrations = [];
    if (db.isFallback()) {
      userExistingRegistrations = db.getMockData().registrations
        .filter(r => Number(r.user_id) === Number(userId) && r.status === 'confirmed')
        .map(r => {
          const ev = db.getMockData().events.find(e => Number(e.event_id) === Number(r.event_id));
          return { ...r, ...ev };
        });
    } else {
      userExistingRegistrations = await db.query(`
        SELECT r.*, e.event_name, e.date, e.start_time, e.end_time, e.venue
        FROM registrations r
        JOIN events e ON r.event_id = e.event_id
        WHERE r.user_id = ? AND r.status = 'confirmed'
      `, [userId]);
    }

    // Compare date and timings
    const targetDateStr = new Date(targetEvent.date).toISOString().split('T')[0];

    for (const reg of userExistingRegistrations) {
      const regDateStr = new Date(reg.date).toISOString().split('T')[0];
      if (regDateStr === targetDateStr) {
        if (hasTimeConflict(targetEvent.start_time, targetEvent.end_time, reg.start_time, reg.end_time)) {
          return res.status(409).json({
            success: false,
            conflict: true,
            message: '⚠️ Schedule Conflict Detected! You are already registered for another event during this time slot.',
            conflicting_event: {
              event_id: reg.event_id,
              event_name: reg.event_name,
              date: regDateStr,
              time: `${reg.start_time.toString().slice(0,5)} - ${reg.end_time.toString().slice(0,5)}`,
              venue: reg.venue
            }
          });
        }
      }
    }

    // Step D: 🧠 SMART CAPACITY & WAITLIST LOGIC 🧠
    let confirmedCount = 0;
    let waitlistCount = 0;

    if (db.isFallback()) {
      confirmedCount = db.getMockData().registrations.filter(r => Number(r.event_id) === Number(event_id) && r.status === 'confirmed').length;
      waitlistCount = db.getMockData().registrations.filter(r => Number(r.event_id) === Number(event_id) && r.status === 'waitlisted').length;
    } else {
      const countRows = await db.query(`
        SELECT 
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed_count,
          COUNT(CASE WHEN status = 'waitlisted' THEN 1 END) AS waitlist_count
        FROM registrations
        WHERE event_id = ?
      `, [event_id]);
      confirmedCount = countRows[0].confirmed_count;
      waitlistCount = countRows[0].waitlist_count;
    }

    const qrToken = generateQRToken(event_id, userId);

    if (confirmedCount < targetEvent.capacity) {
      // Direct confirmed seat
      let newReg;
      if (db.isFallback()) {
        const newRegId = db.getMockData().registrations.reduce((max, r) => Math.max(max, Number(r.registration_id) || 0), 0) + 1;
        newReg = {
          registration_id: newRegId,
          user_id: Number(userId),
          event_id: Number(event_id),
          status: 'confirmed',
          waitlist_position: 0,
          qr_code_token: qrToken,
          attendance_status: 'absent',
          check_in_time: null,
          registration_date: new Date()
        };
        db.getMockData().registrations.push(newReg);
        if (db.saveStore) db.saveStore();
      } else {
        const result = await db.query(`
          INSERT INTO registrations (user_id, event_id, status, waitlist_position, qr_code_token, attendance_status)
          VALUES (?, ?, 'confirmed', 0, ?, 'absent')
        `, [userId, event_id, qrToken]);
        newReg = {
          registration_id: result.insertId,
          user_id: Number(userId),
          event_id: Number(event_id),
          status: 'confirmed',
          waitlist_position: 0,
          qr_code_token: qrToken,
          attendance_status: 'absent',
          check_in_time: null
        };
      }

      return res.status(201).json({
        success: true,
        status: 'confirmed',
        message: '🎉 Registration successful! Your digital QR ticket is ready.',
        qr_code_token: qrToken,
        event_name: targetEvent.event_name,
        registration: newReg
      });
    } else {
      // Event is full -> Allocate to Waitlist Queue
      const waitlistPos = waitlistCount + 1;
      let newReg;

      if (db.isFallback()) {
        const newRegId = db.getMockData().registrations.reduce((max, r) => Math.max(max, Number(r.registration_id) || 0), 0) + 1;
        newReg = {
          registration_id: newRegId,
          user_id: Number(userId),
          event_id: Number(event_id),
          status: 'waitlisted',
          waitlist_position: waitlistPos,
          qr_code_token: qrToken,
          attendance_status: 'absent',
          check_in_time: null,
          registration_date: new Date()
        };
        db.getMockData().registrations.push(newReg);
        if (db.saveStore) db.saveStore();
      } else {
        const result = await db.query(`
          INSERT INTO registrations (user_id, event_id, status, waitlist_position, qr_code_token, attendance_status)
          VALUES (?, ?, 'waitlisted', ?, ?, 'absent')
        `, [userId, event_id, waitlistPos, qrToken]);
        newReg = {
          registration_id: result.insertId,
          user_id: Number(userId),
          event_id: Number(event_id),
          status: 'waitlisted',
          waitlist_position: waitlistPos,
          qr_code_token: qrToken,
          attendance_status: 'absent',
          check_in_time: null
        };
      }

      return res.status(200).json({
        success: true,
        status: 'waitlisted',
        waitlist_position: waitlistPos,
        message: `⏳ Event Full! You have been added to the waitlist at Position #${waitlistPos}. You will be automatically enrolled if a seat opens.`,
        qr_code_token: qrToken,
        event_name: targetEvent.event_name,
        registration: newReg
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration processing failed.' });
  }
}

// 2. Cancel Registration with Automatic Waitlist Promotion
async function cancelRegistration(req, res) {
  try {
    const userId = req.user.user_id;
    const { registration_id } = req.params;

    let regToCancel;
    if (db.isFallback()) {
      regToCancel = db.getMockData().registrations.find(
        r => Number(r.registration_id) === Number(registration_id) && (Number(r.user_id) === Number(userId) || req.user.role === 'admin')
      );
    } else {
      const rows = await db.query(
        'SELECT * FROM registrations WHERE registration_id = ? AND (user_id = ? OR ? = "admin")',
        [registration_id, userId, req.user.role]
      );
      regToCancel = rows[0];
    }

    if (!regToCancel) {
      return res.status(404).json({ success: false, message: 'Registration not found or unauthorized.' });
    }

    const wasConfirmed = regToCancel.status === 'confirmed';
    const eventId = Number(regToCancel.event_id);

    // Mark current registration as cancelled
    if (db.isFallback()) {
      regToCancel.status = 'cancelled';
      regToCancel.waitlist_position = 0;
    } else {
      await db.query('UPDATE registrations SET status = "cancelled", waitlist_position = 0 WHERE registration_id = ?', [registration_id]);
    }

    let promotedStudent = null;

    // If a confirmed ticket was cancelled, automatically promote first student on waitlist!
    if (wasConfirmed) {
      if (db.isFallback()) {
        const waitlistedStudents = db.getMockData().registrations
          .filter(r => Number(r.event_id) === eventId && r.status === 'waitlisted')
          .sort((a, b) => a.waitlist_position - b.waitlist_position);

        if (waitlistedStudents.length > 0) {
          const firstInLine = waitlistedStudents[0];
          firstInLine.status = 'confirmed';
          firstInLine.waitlist_position = 0;
          const user = db.getMockData().users.find(u => Number(u.user_id) === Number(firstInLine.user_id));
          promotedStudent = user ? user.name : `Student #${firstInLine.user_id}`;

          // Shift other waitlist positions down by 1
          for (let i = 1; i < waitlistedStudents.length; i++) {
            waitlistedStudents[i].waitlist_position -= 1;
          }
        }
      } else {
        const waitlistRows = await db.query(`
          SELECT r.*, u.name 
          FROM registrations r
          JOIN users u ON r.user_id = u.user_id
          WHERE r.event_id = ? AND r.status = 'waitlisted'
          ORDER BY r.waitlist_position ASC
          LIMIT 1
        `, [eventId]);

        if (waitlistRows.length > 0) {
          const promoted = waitlistRows[0];
          await db.query('UPDATE registrations SET status = "confirmed", waitlist_position = 0 WHERE registration_id = ?', [promoted.registration_id]);
          await db.query('UPDATE registrations SET waitlist_position = waitlist_position - 1 WHERE event_id = ? AND status = "waitlisted"', [eventId]);
          promotedStudent = promoted.name;
        }
      }
    }

    if (db.saveStore) db.saveStore();

    res.json({
      success: true,
      message: 'Registration cancelled successfully.',
      auto_promoted: promotedStudent ? `Seat freed! ${promotedStudent} (Waitlist #1) has been automatically promoted to Confirmed!` : null
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel registration.' });
  }
}

// 3. Get Logged-in User's Registrations
async function getMyRegistrations(req, res) {
  try {
    const userId = req.user.user_id;
    let registrations;

    if (db.isFallback()) {
      registrations = db.getMockData().registrations
        .filter(r => Number(r.user_id) === Number(userId) && r.status !== 'cancelled')
        .map(r => {
          const ev = db.getMockData().events.find(e => Number(e.event_id) === Number(r.event_id)) || {};
          return {
            ...r,
            event_name: ev.event_name,
            category: ev.category,
            date: ev.date,
            start_time: ev.start_time,
            end_time: ev.end_time,
            venue: ev.venue,
            banner_image: ev.banner_image,
            description: ev.description
          };
        });
    } else {
      registrations = await db.query(`
        SELECT 
          r.*,
          e.event_name,
          e.category,
          e.date,
          e.start_time,
          e.end_time,
          e.venue,
          e.banner_image,
          e.description
        FROM registrations r
        JOIN events e ON r.event_id = e.event_id
        WHERE r.user_id = ? AND r.status != 'cancelled'
        ORDER BY e.date ASC, e.start_time ASC
      `, [userId]);
    }

    res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registrations.' });
  }
}

// 4. Get Event Registrations (Admin View)
async function getEventRegistrations(req, res) {
  try {
    const { event_id } = req.params;
    let registrations;

    if (db.isFallback()) {
      registrations = db.getMockData().registrations
        .filter(r => Number(r.event_id) === Number(event_id) && r.status !== 'cancelled')
        .map(r => {
          const u = db.getMockData().users.find(usr => Number(usr.user_id) === Number(r.user_id)) || {};
          return {
            ...r,
            student_name: u.name,
            student_email: u.email,
            department: u.department
          };
        });
    } else {
      registrations = await db.query(`
        SELECT 
          r.*,
          u.name AS student_name,
          u.email AS student_email,
          u.department
        FROM registrations r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.event_id = ? AND r.status != 'cancelled'
        ORDER BY r.status ASC, r.waitlist_position ASC, r.registration_date ASC
      `, [event_id]);
    }

    res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    console.error('Error fetching event attendees:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendees.' });
  }
}

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventRegistrations
};
