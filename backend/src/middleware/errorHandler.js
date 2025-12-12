/**
 * Global Error Handler Middleware
 * 
 * Catches all errors and sends appropriate responses.
 * In development, includes stack trace. In production, hides internal details.
 */
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle PostgreSQL specific errors
  if (err.code === '23505') {
    error = ApiError.conflict('Resource already exists');
  } else if (err.code === '23503') {
    error = ApiError.badRequest('Referenced resource does not exist');
  } else if (err.code === '55P03') {
    // Lock not available - concurrent booking attempt
    error = ApiError.conflict('This slot is being booked by another user. Please try again.');
  }

  // If not an ApiError, wrap it
  if (!(error instanceof ApiError)) {
    error = new ApiError(
      err.statusCode || 500,
      err.message || 'Internal server error',
      false
    );
  }

  const response = {
    success: false,
    status: error.status,
    message: error.message
  };

  // Include stack trace in development
  if (env.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  // Log error for debugging
  if (!error.isOperational) {
    console.error('ERROR:', err);
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;

