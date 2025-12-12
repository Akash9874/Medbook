/**
 * Booking Controller
 * 
 * Handles all booking-related HTTP requests.
 */
const bookingService = require('../services/bookingService');
const asyncHandler = require('../utils/asyncHandler');

exports.create = asyncHandler(async (req, res) => {
  const { slot_id } = req.body;
  
  const booking = await bookingService.create(req.user.id, slot_id);
  
  res.status(201).json({
    success: true,
    message: 'Booking created. Please confirm within 2 minutes.',
    data: booking
  });
});

exports.confirm = asyncHandler(async (req, res) => {
  const booking = await bookingService.confirm(req.user.id, req.params.id);
  
  res.json({
    success: true,
    message: 'Booking confirmed successfully',
    data: booking
  });
});

exports.cancel = asyncHandler(async (req, res) => {
  await bookingService.cancel(req.user.id, req.params.id);
  
  res.json({
    success: true,
    message: 'Booking cancelled successfully'
  });
});

exports.getMyBookings = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  
  const result = await bookingService.getByUser(req.user.id, {
    status,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20
  });
  
  res.json({
    success: true,
    data: result.bookings,
    pagination: result.pagination
  });
});

exports.getById = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const booking = await bookingService.getById(req.user.id, req.params.id, isAdmin);
  
  res.json({
    success: true,
    data: booking
  });
});

// Admin only
exports.getAll = asyncHandler(async (req, res) => {
  const { status, doctor_id, date, page, limit } = req.query;
  
  const result = await bookingService.getAll({
    status,
    doctor_id,
    date,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20
  });
  
  res.json({
    success: true,
    data: result.bookings,
    pagination: result.pagination
  });
});

// Expire pending bookings (can be called by cron job)
exports.expirePending = asyncHandler(async (req, res) => {
  const count = await bookingService.expirePendingBookings();
  
  res.json({
    success: true,
    message: `Expired ${count} pending bookings`
  });
});

