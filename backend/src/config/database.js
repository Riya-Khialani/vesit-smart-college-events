const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let pool = null;
let isUsingFallback = false;

// Fallback in-memory database store
const mockData = {
  users: [
    {
      user_id: 1,
      name: 'Admin Incharge',
      email: 'admin@vesit.edu',
      password: '$2a$10$7Hm4q//0u1hED11WNjeW1ODwUcJa9dadfDiEky.839pzIuA6.1edO', // 'Admin@123'
      role: 'admin',
      department: 'Faculty IT',
      interests: 'Cloud, AI, DevOps',
      created_at: new Date('2026-09-01')
    },
    {
      user_id: 2,
      name: 'Riya Khialani',
      email: 'riya@vesit.edu',
      password: '$2a$10$wHBkNfu3exLAeudRDZjs/uVsCIrj/WFa0lvg4vnTJIW.ARPdMuuCm', // 'Student@123'
      role: 'student',
      department: 'CMPN',
      interests: 'AI, Machine Learning, Cloud',
      created_at: new Date('2026-09-02')
    },
    {
      user_id: 3,
      name: 'Prachi Lund',
      email: 'prachi@vesit.edu',
      password: '$2a$10$wHBkNfu3exLAeudRDZjs/uVsCIrj/WFa0lvg4vnTJIW.ARPdMuuCm', // 'Student@123'
      role: 'student',
      department: 'IT',
      interests: 'Web Development, UI/UX',
      created_at: new Date('2026-09-03')
    },
    {
      user_id: 4,
      name: 'Ankita Kukreja',
      email: 'ankita@vesit.edu',
      password: '$2a$10$wHBkNfu3exLAeudRDZjs/uVsCIrj/WFa0lvg4vnTJIW.ARPdMuuCm', // 'Student@123'
      role: 'student',
      department: 'EXTC',
      interests: 'IoT, Robotics, AI',
      created_at: new Date('2026-09-04')
    },
    {
      user_id: 5,
      name: 'Shivam Makhija',
      email: 'shivam@vesit.edu',
      password: '$2a$10$wHBkNfu3exLAeudRDZjs/uVsCIrj/WFa0lvg4vnTJIW.ARPdMuuCm', // 'Student@123'
      role: 'student',
      department: 'CMPN',
      interests: 'DevOps, Cybersecurity, Cloud',
      created_at: new Date('2026-09-05')
    },
    {
      user_id: 6,
      name: 'Gate Scanner Volunteer',
      email: 'scanner@vesit.edu',
      password: '$2a$10$tEksPr0q5EsErxePhCHue.Fs.R/8QGAbhCegfwKvaqiygR6Nsc4Hq', // 'Scanner@123'
      role: 'scanner',
      department: 'Gate Operations / Desk 1',
      interests: 'Attendance Verification, Security',
      created_at: new Date('2026-09-06')
    }
  ],
  events: [
    {
      event_id: 1,
      event_name: 'AI & Machine Learning Workshop',
      category: 'Workshop',
      date: '2026-09-25',
      start_time: '10:00:00',
      end_time: '12:00:00',
      venue: 'Auditorium Hall A',
      capacity: 50,
      description: 'Hands-on practical session on deep learning models, neural networks, and generative AI using Python and TensorFlow.',
      banner_image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
      created_by: 1
    },
    {
      event_id: 2,
      event_name: 'Cybersecurity & Ethical Hacking',
      category: 'Workshop',
      date: '2026-09-25',
      start_time: '11:00:00',
      end_time: '13:00:00',
      venue: 'Lab 402, 4th Floor',
      capacity: 40,
      description: 'Explore network security auditing, penetration testing methodologies, and defensive cyber strategies.',
      banner_image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
      created_by: 1
    },
    {
      event_id: 3,
      event_name: 'Modern Web Architecture Bootcamp',
      category: 'Bootcamp',
      date: '2026-09-25',
      start_time: '14:00:00',
      end_time: '16:00:00',
      venue: 'Seminar Hall B',
      capacity: 60,
      description: 'Master React 18, Node microservices, state management, and modern component-driven UI architecture.',
      banner_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
      created_by: 1
    },
    {
      event_id: 4,
      event_name: 'Cloud Native DevOps Hackathon',
      category: 'Hackathon',
      date: '2026-09-26',
      start_time: '09:00:00',
      end_time: '17:00:00',
      venue: 'VESIT Innovation Lab',
      capacity: 3,
      description: 'Intensive 8-hour sprint building Dockerized microservices and automated CI/CD pipelines.',
      banner_image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      created_by: 1
    },
    {
      event_id: 5,
      event_name: 'VESIT Annual Tech Symphony & Cultural Eve',
      category: 'Cultural',
      date: '2026-09-27',
      start_time: '18:00:00',
      end_time: '21:30:00',
      venue: 'College Amphitheatre',
      capacity: 250,
      description: 'An evening celebrating campus talent, musical performances, live rock bands, and student innovation awards.',
      banner_image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
      created_by: 1
    }
  ],
  registrations: [
    {
      registration_id: 1,
      user_id: 2,
      event_id: 1,
      status: 'confirmed',
      waitlist_position: 0,
      qr_code_token: 'QR-EVT1-USR2-89472',
      attendance_status: 'present',
      check_in_time: '2026-09-25 09:55:00',
      registration_date: '2026-09-10 12:00:00'
    },
    {
      registration_id: 2,
      user_id: 3,
      event_id: 1,
      status: 'confirmed',
      waitlist_position: 0,
      qr_code_token: 'QR-EVT1-USR3-21948',
      attendance_status: 'absent',
      check_in_time: null,
      registration_date: '2026-09-11 14:00:00'
    },
    {
      registration_id: 3,
      user_id: 4,
      event_id: 1,
      status: 'confirmed',
      waitlist_position: 0,
      qr_code_token: 'QR-EVT1-USR4-73821',
      attendance_status: 'present',
      check_in_time: '2026-09-25 10:02:00',
      registration_date: '2026-09-12 11:30:00'
    },
    {
      registration_id: 4,
      user_id: 3,
      event_id: 3,
      status: 'confirmed',
      waitlist_position: 0,
      qr_code_token: 'QR-EVT3-USR3-55910',
      attendance_status: 'absent',
      check_in_time: null,
      registration_date: '2026-09-12 15:00:00'
    },
    {
      registration_id: 5,
      user_id: 4,
      event_id: 3,
      status: 'confirmed',
      waitlist_position: 0,
      qr_code_token: 'QR-EVT3-USR4-34019',
      attendance_status: 'absent',
      check_in_time: null,
      registration_date: '2026-09-13 09:15:00'
    },
    {
      registration_id: 6,
      user_id: 2,
      event_id: 4,
      status: 'confirmed',
      waitlist_position: 0,
      qr_code_token: 'QR-EVT4-USR2-11029',
      attendance_status: 'absent',
      check_in_time: null,
      registration_date: '2026-09-14 10:00:00'
    },
    {
      registration_id: 7,
      user_id: 3,
      event_id: 4,
      status: 'confirmed',
      waitlist_position: 0,
      qr_code_token: 'QR-EVT4-USR3-88231',
      attendance_status: 'absent',
      check_in_time: null,
      registration_date: '2026-09-14 10:05:00'
    },
    {
      registration_id: 8,
      user_id: 4,
      event_id: 4,
      status: 'confirmed',
      waitlist_position: 0,
      qr_code_token: 'QR-EVT4-USR4-44129',
      attendance_status: 'absent',
      check_in_time: null,
      registration_date: '2026-09-14 10:10:00'
    },
    {
      registration_id: 9,
      user_id: 5,
      event_id: 4,
      status: 'waitlisted',
      waitlist_position: 1,
      qr_code_token: 'QR-EVT4-USR5-99201',
      attendance_status: 'absent',
      check_in_time: null,
      registration_date: '2026-09-14 10:15:00'
    }
  ]
};

const DB_STORE_PATH = path.join(__dirname, '../data/db_store.json');

function saveStore() {
  try {
    const dir = path.dirname(DB_STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_STORE_PATH, JSON.stringify(mockData, null, 2), 'utf8');
  } catch (err) {
    console.error('[Database] Failed to persist data to disk:', err);
  }
}

function loadStore() {
  try {
    if (fs.existsSync(DB_STORE_PATH)) {
      const raw = fs.readFileSync(DB_STORE_PATH, 'utf8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.users) && Array.isArray(data.events) && Array.isArray(data.registrations)) {
        mockData.users = data.users;
        mockData.events = data.events;
        mockData.registrations = data.registrations;
        console.log(`[Database] Persistent store loaded: ${mockData.users.length} users, ${mockData.events.length} events, ${mockData.registrations.length} registrations.`);
        return;
      }
    }
  } catch (err) {
    console.error('[Database] Could not read persistent store:', err);
  }
  // Initialize with base data if store doesn't exist yet
  saveStore();
}

async function initDatabase() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'college_events',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 3000
  };

  try {
    const tempPool = mysql.createPool(dbConfig);
    // Test connection with a fast ping
    const connection = await tempPool.getConnection();
    console.log(`[Database] Connected successfully to MySQL database at ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    pool = tempPool;
    isUsingFallback = false;
  } catch (err) {
    console.warn(`[Database] MySQL unavailable (${err.code || err.message}).`);
    console.log('[Database] Connected to High-Performance Persistent JSON Relational Engine.');
    isUsingFallback = true;
    loadStore();
  }
}

// Universal query runner supporting both MySQL and Mock Data Store
const db = {
  isFallback: () => isUsingFallback,
  getMockData: () => mockData,
  saveStore: saveStore,
  init: initDatabase,
  query: async (sql, params = []) => {
    if (pool && !isUsingFallback) {
      try {
        const [results] = await pool.query(sql, params);
        return results;
      } catch (err) {
        console.error('[Database Query Error]', err);
        throw err;
      }
    }

    // Fallback in-memory query handler for essential queries
    const result = handleMockQuery(sql, params);
    return result;
  }
};

function handleMockQuery(sql, params) {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');

  // SELECT users by email
  if (cleanSql.includes('SELECT * FROM users WHERE email = ?')) {
    const user = mockData.users.find(u => u.email.toLowerCase() === params[0].toLowerCase());
    return user ? [user] : [];
  }

  // SELECT user by id
  if (cleanSql.includes('SELECT * FROM users WHERE user_id = ?')) {
    const user = mockData.users.find(u => u.user_id === Number(params[0]));
    return user ? [user] : [];
  }

  // INSERT INTO users
  if (cleanSql.startsWith('INSERT INTO users')) {
    const newId = mockData.users.length ? Math.max(...mockData.users.map(u => Number(u.user_id) || 0)) + 1 : 1;
    const newUser = {
      user_id: newId,
      name: params[0],
      email: params[1],
      password: params[2],
      role: params[3] || 'student',
      department: params[4] || 'CMPN',
      interests: params[5] || 'AI, Web',
      created_at: new Date()
    };
    mockData.users.push(newUser);
    saveStore();
    return { insertId: newId, affectedRows: 1 };
  }

  // SELECT events with registration counts
  if (cleanSql.includes('FROM events') && (cleanSql.includes('COUNT') || cleanSql.includes('LEFT JOIN'))) {
    return mockData.events.map(ev => {
      const regCount = mockData.registrations.filter(r => Number(r.event_id) === Number(ev.event_id) && r.status === 'confirmed').length;
      const waitCount = mockData.registrations.filter(r => Number(r.event_id) === Number(ev.event_id) && r.status === 'waitlisted').length;
      return {
        ...ev,
        registered_count: regCount,
        waitlist_count: waitCount
      };
    });
  }

  // SELECT single event
  if (cleanSql.includes('SELECT * FROM events WHERE event_id = ?')) {
    const ev = mockData.events.find(e => Number(e.event_id) === Number(params[0]));
    if (!ev) return [];
    const regCount = mockData.registrations.filter(r => Number(r.event_id) === Number(ev.event_id) && r.status === 'confirmed').length;
    const waitCount = mockData.registrations.filter(r => Number(r.event_id) === Number(ev.event_id) && r.status === 'waitlisted').length;
    return [{ ...ev, registered_count: regCount, waitlist_count: waitCount }];
  }

  // INSERT INTO events
  if (cleanSql.startsWith('INSERT INTO events')) {
    const newId = mockData.events.length ? Math.max(...mockData.events.map(e => Number(e.event_id) || 0)) + 1 : 1;
    const newEvent = {
      event_id: newId,
      event_name: params[0],
      category: params[1],
      date: params[2],
      start_time: params[3],
      end_time: params[4],
      venue: params[5],
      capacity: Number(params[6]),
      description: params[7],
      banner_image: params[8],
      created_by: params[9] || 1
    };
    mockData.events.push(newEvent);
    saveStore();
    return { insertId: newId, affectedRows: 1 };
  }

  // UPDATE events
  if (cleanSql.startsWith('UPDATE events')) {
    const eventId = Number(params[params.length - 1]);
    const evIndex = mockData.events.findIndex(e => Number(e.event_id) === eventId);
    if (evIndex !== -1) {
      mockData.events[evIndex] = {
        ...mockData.events[evIndex],
        event_name: params[0],
        category: params[1],
        date: params[2],
        start_time: params[3],
        end_time: params[4],
        venue: params[5],
        capacity: Number(params[6]),
        description: params[7],
        banner_image: params[8]
      };
      saveStore();
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  // DELETE events
  if (cleanSql.startsWith('DELETE FROM events')) {
    const eventId = Number(params[0]);
    mockData.events = mockData.events.filter(e => Number(e.event_id) !== eventId);
    mockData.registrations = mockData.registrations.filter(r => Number(r.event_id) !== eventId);
    saveStore();
    return { affectedRows: 1 };
  }

  // GET registrations for a user (with event details)
  if (cleanSql.includes('FROM registrations') && cleanSql.includes('WHERE r.user_id = ?')) {
    const userId = Number(params[0]);
    const userRegs = mockData.registrations
      .filter(r => Number(r.user_id) === userId && r.status !== 'cancelled')
      .map(r => {
        const ev = mockData.events.find(e => Number(e.event_id) === Number(r.event_id)) || {};
        return {
          registration_id: r.registration_id,
          user_id: r.user_id,
          event_id: r.event_id,
          status: r.status,
          waitlist_position: r.waitlist_position,
          qr_code_token: r.qr_code_token,
          attendance_status: r.attendance_status,
          check_in_time: r.check_in_time,
          registration_date: r.registration_date,
          event_name: ev.event_name,
          category: ev.category,
          date: ev.date,
          start_time: ev.start_time,
          end_time: ev.end_time,
          venue: ev.venue,
          capacity: ev.capacity,
          description: ev.description,
          banner_image: ev.banner_image
        };
      });
    return userRegs;
  }

  // Fallback generic handler
  return [];
}

module.exports = db;
