/**
 * Rate Limiting Middleware
 * 
 * Prevents abuse by limiting requests per IP.
 * Different limits for different endpoints.
 */
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window (increased for development)
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  }
});

// Limit for booking to prevent abuse
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 booking attempts per minute
  message: {
    success: false,
    message: 'Too many booking attempts, please slow down'
  }
});

module.exports = { apiLimiter, authLimiter, bookingLimiter };

