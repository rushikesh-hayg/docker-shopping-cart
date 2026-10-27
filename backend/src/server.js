const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { initDb, getDbInstance } = require('./db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logging
if (NODE_ENV !== 'test') {
  app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API Router mounted under /api
app.use('/api', apiRoutes);

// Root fallback & info
app.get('/', (req, res) => {
  res.json({
    name: 'Dockerized Shopping Cart REST API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      catalog: 'GET /api/products',
      search: 'GET /api/products/search?q=:term',
      product_details: 'GET /api/products/:id',
      checkout: 'POST /api/checkout',
      orders: 'GET /api/orders',
      admin_stats: 'GET /api/admin/stats'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[SERVER UNHANDLED ERROR]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

// Startup logic
let serverInstance = null;

async function startServer() {
  try {
    console.log('[BOOTSTRAP] Initializing database and tables...');
    await initDb();

    serverInstance = app.listen(PORT, () => {
      console.log(`======================================================`);
      console.log(`🚀 Shopping Cart API running on http://localhost:${PORT}`);
      console.log(`📦 Environment: ${NODE_ENV}`);
      console.log(`🩺 Health Probe: http://localhost:${PORT}/api/health`);
      console.log(`======================================================`);
    });
  } catch (err) {
    console.error('[FATAL] Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful Shutdown
function gracefulShutdown(signal) {
  console.log(`\n[SHUTDOWN] Received ${signal}. Closing HTTP server...`);
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('[SHUTDOWN] HTTP server closed.');
      const db = getDbInstance();
      if (db) {
        db.close((err) => {
          if (err) console.error('[SHUTDOWN] Error closing SQLite database:', err.message);
          else console.log('[SHUTDOWN] SQLite database connection closed.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Only auto-start if run directly (allows importing in integration tests)
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
