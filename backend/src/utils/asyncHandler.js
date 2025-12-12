/**
 * Async Handler Wrapper
 * 
 * Wraps async route handlers to catch errors and pass them to Express error middleware.
 * This eliminates the need for try-catch in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

