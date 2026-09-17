const db = require('../config/database');

// Admin Analytics Dashboard Data
async function getAdminAnalytics(req, res) {
  try {
    let events = [];
    let registrations = [];
    let users = [];

    if (db.isFallback()) {
      events = db.getMockData().events;
      registrations = db.getMockData().registrations.filter(r => r.status !== 'cancelled');
      users = db.getMockData().users;
    } else {
      events = await db.query('SELECT * FROM events');
      registrations = await db.query('SELECT * FROM registrations WHERE status != "cancelled"');
      users = await db.query('SELECT user_id, name, department, role FROM users');
    }

    const totalEvents = events.length;
    const totalRegistrations = registrations.length;
    const totalConfirmed = registrations.filter(r => r.status === 'confirmed').length;
    const totalPresent = registrations.filter(r => r.attendance_status === 'present').length;
    const totalWaitlisted = registrations.filter(r => r.status === 'waitlisted').length;

    const overallAttendanceRate = totalConfirmed > 0
      ? Math.round((totalPresent / totalConfirmed) * 100)
      : 0;

    // Per Event Breakdown
    const eventBreakdown = events.map(ev => {
      const eventRegs = registrations.filter(r => Number(r.event_id) === Number(ev.event_id));
      const confirmed = eventRegs.filter(r => r.status === 'confirmed').length;
      const waitlisted = eventRegs.filter(r => r.status === 'waitlisted').length;
      const present = eventRegs.filter(r => r.attendance_status === 'present').length;
      const attendancePct = confirmed > 0 ? Math.round((present / confirmed) * 100) : 0;

      return {
        event_id: ev.event_id,
        event_name: ev.event_name,
        category: ev.category,
        capacity: ev.capacity,
        confirmed,
        waitlisted,
        present,
        attendance_rate: attendancePct,
        fill_rate: Number(ev.capacity) > 0 ? Math.round((confirmed / Number(ev.capacity)) * 100) : 0
      };
    });

    // Most popular event
    const sortedByPopularity = [...eventBreakdown].sort((a, b) => (b.confirmed + b.waitlisted) - (a.confirmed + a.waitlisted));
    const mostPopularEvent = sortedByPopularity.length > 0 ? sortedByPopularity[0].event_name : 'N/A';

    // Department Breakdown
    const deptMap = {};
    registrations.forEach(r => {
      const u = users.find(usr => Number(usr.user_id) === Number(r.user_id));
      const dept = u ? u.department : 'Other';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    const departmentBreakdown = Object.keys(deptMap).map(dept => ({
      department: dept,
      count: deptMap[dept],
      percentage: totalRegistrations > 0 ? Math.round((deptMap[dept] / totalRegistrations) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    const topDepartment = departmentBreakdown.length > 0 ? departmentBreakdown[0].department : 'CMPN';

    res.json({
      success: true,
      metrics: {
        total_events: totalEvents,
        total_registrations: totalRegistrations,
        total_confirmed: totalConfirmed,
        total_waitlisted: totalWaitlisted,
        total_present: totalPresent,
        overall_attendance_rate: overallAttendanceRate,
        most_popular_event: mostPopularEvent,
        highest_participating_dept: topDepartment
      },
      event_breakdown: eventBreakdown,
      department_breakdown: departmentBreakdown
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to compute analytics.' });
  }
}

module.exports = {
  getAdminAnalytics
};
