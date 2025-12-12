/**
 * Application Constants
 */
module.exports = {
  BOOKING_STATUS: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED'
  },
  
  USER_ROLES: {
    ADMIN: 'ADMIN',
    USER: 'USER'
  },
  
  // Booking expires after 2 minutes if not confirmed
  BOOKING_EXPIRY_MINUTES: 2,
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

