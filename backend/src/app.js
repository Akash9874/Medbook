/**
 * MedBook API - Main Application Entry Point
 * 
 * Doctor Appointment Booking System with concurrency-safe booking.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.cors.origin,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', apiLimiter);

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MedBook API Documentation'
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = env.port;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║           MedBook API Server Started              ║
╠═══════════════════════════════════════════════════╣
║  Environment: ${env.nodeEnv.padEnd(35)}║
║  Port: ${String(PORT).padEnd(42)}║
║  API Docs: http://localhost:${PORT}/api/docs${' '.repeat(10)}║
╚═══════════════════════════════════════════════════╝
  `);
});

module.exports = app;

