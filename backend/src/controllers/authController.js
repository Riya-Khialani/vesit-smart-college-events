const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// Login Controller
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let users;
    if (db.isFallback()) {
      users = db.getMockData().users.filter(u => u.email.trim().toLowerCase() === cleanEmail);
    } else {
      users = await db.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = ?', [cleanEmail]);
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];
    
    // Production bcrypt comparison
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        interests: user.interests
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        interests: user.interests
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

// Register Controller - Public signup is STRICTLY for students/attendees
async function register(req, res) {
  try {
    const { name, email, password, department = 'CMPN', interests = 'Engineering, Technology' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Security lockdown: Public registration can NEVER create scanner or admin accounts.
    // Scanner and Admin privileges must be assigned by college administration.
    const assignedRole = 'student';

    // Check if user already exists
    let existing;
    if (db.isFallback()) {
      existing = db.getMockData().users.find(u => u.email.trim().toLowerCase() === cleanEmail);
    } else {
      const rows = await db.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = ?', [cleanEmail]);
      existing = rows[0];
    }

    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in instead.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newUser;
    if (db.isFallback()) {
      const newId = db.getMockData().users.length ? Math.max(...db.getMockData().users.map(u => u.user_id)) + 1 : 1;
      newUser = {
        user_id: newId,
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: assignedRole,
        department,
        interests,
        created_at: new Date()
      };
      db.getMockData().users.push(newUser);
      if (db.saveStore) db.saveStore();
    } else {
      const result = await db.query(
        'INSERT INTO users (name, email, password, role, department, interests) VALUES (?, ?, ?, ?, ?, ?)',
        [cleanName, cleanEmail, hashedPassword, assignedRole, department, interests]
      );
      newUser = {
        user_id: result.insertId,
        name: cleanName,
        email: cleanEmail,
        role: assignedRole,
        department,
        interests
      };
    }

    const token = jwt.sign(
      {
        user_id: newUser.user_id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
        interests: newUser.interests
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        user_id: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        interests: newUser.interests
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
}

// Get Current User Profile
async function getProfile(req, res) {
  try {
    const userId = req.user.user_id;
    let user;

    if (db.isFallback()) {
      user = db.getMockData().users.find(u => Number(u.user_id) === Number(userId));
    } else {
      const rows = await db.query('SELECT user_id, name, email, role, department, interests, created_at FROM users WHERE user_id = ?', [userId]);
      user = rows[0];
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        interests: user.interests,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
}

// Get All Users (Admin Only)
async function getAllUsers(req, res) {
  try {
    let users;
    if (db.isFallback()) {
      users = db.getMockData().users.map(u => ({
        user_id: u.user_id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        created_at: u.created_at
      }));
    } else {
      users = await db.query('SELECT user_id, name, email, role, department, created_at FROM users ORDER BY user_id ASC');
    }

    res.json({ success: true, users });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve user list.' });
  }
}

// Update User Role (Admin Only)
async function updateUserRole(req, res) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;

    const validRoles = ['student', 'scanner', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified. Must be one of: ${validRoles.join(', ')}`
      });
    }

    if (db.isFallback()) {
      const user = db.getMockData().users.find(u => Number(u.user_id) === targetUserId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      user.role = role;
      if (db.saveStore) db.saveStore();
      return res.json({
        success: true,
        message: `Updated role for ${user.name} to ${role}.`,
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      const rows = await db.query('SELECT user_id, name, email FROM users WHERE user_id = ?', [targetUserId]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      await db.query('UPDATE users SET role = ? WHERE user_id = ?', [role, targetUserId]);
      return res.json({
        success: true,
        message: `Updated role for ${rows[0].name} to ${role}.`,
        user: {
          user_id: rows[0].user_id,
          name: rows[0].name,
          email: rows[0].email,
          role
        }
      });
    }
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Server error updating user role.' });
  }
}

module.exports = {
  login,
  register,
  getProfile,
  getAllUsers,
  updateUserRole
};
