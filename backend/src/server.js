/**
 * RedVelvet Backend Server
 * SECURE Node.js + PostgreSQL API
 *
 * SECURITY FEATURES:
 * ✓ Bcrypt password hashing
 * ✓ JWT authentication with refresh tokens
 * ✓ SQL injection protection (prepared statements)
 * ✓ XSS protection (helmet + sanitization)
 * ✓ CORS configuration
 * ✓ Rate limiting
 * ✓ Input validation
 * ✓ Error handling
 * ✓ Security headers
 */

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');

// Import configurations
const { testConnection } = require('./config/database');

// Import middleware
const {
  securityHeaders,
  generalLimiter,
  corsMiddleware,
  logSuspiciousActivity,
  preventParameterPollution
} = require('./middleware/security');

const {
  errorHandler,
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException
} = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== SECURITY MIDDLEWARE ====================

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security headers (helmet)
app.use(securityHeaders);

// CORS
app.use(corsMiddleware);

// Rate limiting
app.use('/api/', generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (только в development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Custom security middleware
app.use(logSuspiciousActivity);
app.use(preventParameterPollution);

// ==================== ROUTES ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);

// API documentation
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'RedVelvet API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me'
      },
      profiles: {
        list: 'GET /api/profiles',
        get: 'GET /api/profiles/:id',
        create: 'POST /api/profiles',
        update: 'PUT /api/profiles/:id',
        delete: 'DELETE /api/profiles/:id'
      }
    },
    documentation: 'https://github.com/ivankiashko/redvelvet/blob/main/backend/README.md'
  });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Handle unhandled rejections and uncaught exceptions
handleUnhandledRejection();
handleUncaughtException();

// ==================== SERVER START ====================

const startServer = async () => {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Server not started.');
      process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║   🚀 RedVelvet Backend Server         ║');
      console.log('╚════════════════════════════════════════╝');
      console.log('');
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API URL: http://localhost:${PORT}/api`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('Security features enabled:');
      console.log('  ✓ Bcrypt password hashing');
      console.log('  ✓ JWT authentication');
      console.log('  ✓ SQL injection protection');
      console.log('  ✓ XSS protection');
      console.log('  ✓ CORS configured');
      console.log('  ✓ Rate limiting');
      console.log('  ✓ Input validation');
      console.log('  ✓ Security headers');
      console.log('');
      console.log('Press Ctrl+C to stop the server');
      console.log('════════════════════════════════════════');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('');
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
