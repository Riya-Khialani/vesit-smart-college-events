const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable HTTP Gzip compression for 70%+ reduced network payloads on mobile
app.use(compression());

// Enable CORS and JSON body parser
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// HTTP Request logger for auditing and container observability
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint for Docker and Kubernetes probes
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'college-event-backend',
    database_mode: db.isFallback() ? 'resilient in-memory engine' : 'mysql live connection',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve frontend static build in production if available
const path = require('path');
const fs = require('fs');
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, {
    maxAge: '1d',
    etag: true,
    lastModified: true
  }));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // API info fallback if frontend is not built
  app.get('/', (req, res) => {
    res.json({
      message: 'Smart College Event Management System API',
      version: '1.0.0',
      group: 'Group 11 (VESIT D17A)',
      health: '/health',
      docs: '/api/events'
    });
  });
}

// 404 handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Start Server
async function startServer() {
  await db.init();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Smart College Event Backend running on port ${PORT}`);
    console.log(`📡 Health check available at: http://localhost:${PORT}/health`);
  });
}

startServer();

module.exports = app;
