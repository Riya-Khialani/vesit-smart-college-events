const db = require('../config/database');

// 1. Scan and Record Attendance via QR Token (Admin Only)
async function markAttendanceByQR(req, res) {
  try {
    const { qr_code_token } = req.body;

    if (!qr_code_token || !qr_code_token.trim()) {
      return res.status(400).json({ success: false, message: 'QR Code token is required.' });
    }

    const token = qr_code_token.trim();

    let registration;
    let student;
    let event;

    if (db.isFallback()) {
      registration = db.getMockData().registrations.find(r => 
        (r.qr_code_token === token || String(r.registration_id) === token) && r.status !== 'cancelled'
      );
      if (registration) {
        student = db.getMockData().users.find(u => Number(u.user_id) === Number(registration.user_id));
        event = db.getMockData().events.find(e => Number(e.event_id) === Number(registration.event_id));
      }
    } else {
      const numericId = isNaN(Number(token)) ? -1 : Number(token);
      const rows = await db.query(`
        SELECT 
          r.*,
          u.name AS student_name,
          u.email AS student_email,
          u.department,
          e.event_name,
          e.date,
          e.venue
        FROM registrations r
        JOIN users u ON r.user_id = u.user_id
        JOIN events e ON r.event_id = e.event_id
        WHERE (r.qr_code_token = ? OR r.registration_id = ?) AND r.status != 'cancelled'
      `, [token, numericId]);
      if (rows.length > 0) {
        registration = rows[0];
        student = { name: registration.student_name, email: registration.student_email, department: registration.department };
        event = { event_name: registration.event_name, date: registration.date, venue: registration.venue };
      }
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR Ticket or registration not found for this code.'
      });
    }

    if (registration.status === 'waitlisted') {
      return res.status(400).json({
        success: false,
        message: `⚠️ Entry Denied: Student (${student?.name}) is currently on the waitlist, not confirmed.`
      });
    }

    if (registration.attendance_status === 'present') {
      return res.status(200).json({
        success: true,
        already_checked_in: true,
        message: `ℹ️ Student ${student?.name} is already checked in at ${new Date(registration.check_in_time).toLocaleTimeString()}!`,
        student,
        event
      });
    }

    const checkInTime = new Date();

    if (db.isFallback()) {
      registration.attendance_status = 'present';
      registration.check_in_time = checkInTime;
      if (db.saveStore) db.saveStore();
    } else {
      await db.query(
        'UPDATE registrations SET attendance_status = "present", check_in_time = NOW() WHERE registration_id = ?',
        [registration.registration_id]
      );
    }

    res.json({
      success: true,
      message: `✅ Attendance recorded! Welcome, ${student?.name || 'Student'}.`,
      attendee: {
        registration_id: registration.registration_id,
        name: student?.name,
        student_name: student?.name,
        email: student?.email,
        student_email: student?.email,
        department: student?.department,
        event_name: event?.event_name,
        check_in_time: checkInTime
      }
    });
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to record attendance.' });
  }
}

// 2. Manual toggle attendance for admin list
async function toggleAttendance(req, res) {
  try {
    const { registration_id } = req.params;
    const { attendance_status } = req.body; // 'present' or 'absent'

    if (!['present', 'absent'].includes(attendance_status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be "present" or "absent".' });
    }

    const checkInTime = attendance_status === 'present' ? new Date() : null;

    if (db.isFallback()) {
      const reg = db.getMockData().registrations.find(r => Number(r.registration_id) === Number(registration_id));
      if (!reg) return res.status(404).json({ success: false, message: 'Registration not found.' });
      reg.attendance_status = attendance_status;
      reg.check_in_time = checkInTime;
      if (db.saveStore) db.saveStore();
    } else {
      await db.query(
        'UPDATE registrations SET attendance_status = ?, check_in_time = ? WHERE registration_id = ?',
        [attendance_status, checkInTime, registration_id]
      );
    }

    res.json({
      success: true,
      message: `Attendance updated to ${attendance_status}.`
    });
  } catch (error) {
    console.error('Toggle attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to update attendance.' });
  }
}

module.exports = {
  markAttendanceByQR,
  toggleAttendance
};
