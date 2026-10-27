const express = require('express');
const router = express.Router();
const { getProducts, searchProducts, getProductById } = require('../controllers/productController');
const { checkout, getAllOrders, getAdminStats } = require('../controllers/orderController');
const { dbGet } = require('../db');

/**
 * Health Check Endpoint for Docker HEALTHCHECK, Jenkins Probes, and Kubernetes readiness
 * GET /api/health
 */
router.get('/health', async (req, res) => {
  try {
    // Ping DB to ensure active connection
    await dbGet('SELECT 1');
    res.status(200).json({
      status: 'UP',
      service: 'docker-shopping-cart-backend',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({
      status: 'DOWN',
      service: 'docker-shopping-cart-backend',
      error: 'Database connection check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Product routes
router.get('/products/search', searchProducts);
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

// Order and checkout routes
router.post('/checkout', checkout);
router.get('/orders', getAllOrders);

// Admin dashboard metrics
router.get('/admin/stats', getAdminStats);

module.exports = router;
