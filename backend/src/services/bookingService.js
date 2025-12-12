/**
 * Booking Service
 * 
 * CRITICAL: This is where concurrency handling happens.
 * 
 * We use PostgreSQL database functions with row-level locking
 * to ensure atomic operations and prevent race conditions.
 */
const { pool, supabase } = require('../config/database');
const ApiError = require('../utils/ApiError');
const { BOOKING_STATUS } = require('../utils/constants');

class BookingService {
  /**
   * Create a new booking
   * 
   * Uses the book_slot database function which:
   * 1. Locks the slot row with FOR UPDATE NOWAIT
   * 2. Checks availability
   * 3. Creates booking with PENDING status
   * 4. Marks slot as unavailable
   * 
   * All in a single atomic transaction.
   */
  async create(userId, slotId) {
    const result = await pool.query(
      'SELECT book_slot($1, $2) as result',
      [userId, slotId]
    );

    const response = result.rows[0].result;

    if (!response.success) {
      if (response.error === 'SLOT_UNAVAILABLE') {
        throw ApiError.conflict(response.message);
      }
      if (response.error === 'SLOT_LOCKED') {
        throw ApiError.conflict(response.message);
      }
      if (response.error === 'SLOT_ALREADY_BOOKED') {
        throw ApiError.conflict(response.message);
      }
      throw ApiError.badRequest(response.message);
    }

    return response.booking;
  }

  /**
   * Confirm a pending booking
   */
  async confirm(userId, bookingId) {
    const result = await pool.query(
      'SELECT confirm_booking($1, $2) as result',
      [userId, bookingId]
    );

    const response = result.rows[0].result;

    if (!response.success) {
      if (response.error === 'BOOKING_NOT_FOUND') {
        throw ApiError.notFound(response.message);
      }
      if (response.error === 'BOOKING_EXPIRED') {
        throw ApiError.conflict(response.message);
      }
      throw ApiError.badRequest(response.message);
    }

    // Fetch updated booking
    return this.getById(userId, bookingId);
  }

  /**
   * Cancel a booking
   */
  async cancel(userId, bookingId) {
    const result = await pool.query(
      'SELECT cancel_booking($1, $2) as result',
      [userId, bookingId]
    );

    const response = result.rows[0].result;

    if (!response.success) {
      if (response.error === 'BOOKING_NOT_FOUND') {
        throw ApiError.notFound(response.message);
      }
      throw ApiError.badRequest(response.message);
    }

    return { message: response.message };
  }

  /**
   * Get user's bookings
   */
  async getByUser(userId, { status, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    
    let baseQuery = `
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      JOIN doctors d ON b.doctor_id = d.id
      WHERE b.user_id = $1
    `;
    const params = [userId];

    if (status) {
      params.push(status);
      baseQuery += ` AND b.status = $${params.length}`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Get paginated results
    const dataQuery = `
      SELECT b.*, 
        s.start_time, s.end_time,
        d.name as doctor_name, d.specialization, d.consultation_fee
      ${baseQuery}
      ORDER BY s.start_time DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await pool.query(dataQuery, params);

    return {
      bookings: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single booking by ID
   */
  async getById(userId, bookingId, isAdmin = false) {
    let query = `
      SELECT b.*, 
        s.start_time, s.end_time,
        d.name as doctor_name, d.specialization, d.consultation_fee, d.qualification,
        u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      JOIN doctors d ON b.doctor_id = d.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = $1
    `;
    const params = [bookingId];

    // Non-admins can only see their own bookings
    if (!isAdmin) {
      params.push(userId);
      query += ` AND b.user_id = $${params.length}`;
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      throw ApiError.notFound('Booking not found');
    }

    return result.rows[0];
  }

  /**
   * Get all bookings (admin only)
   */
  async getAll({ status, doctor_id, date, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    
    let baseQuery = `
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      JOIN doctors d ON b.doctor_id = d.id
      JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      baseQuery += ` AND b.status = $${params.length}`;
    }

    if (doctor_id) {
      params.push(doctor_id);
      baseQuery += ` AND b.doctor_id = $${params.length}`;
    }

    if (date) {
      params.push(date);
      baseQuery += ` AND DATE(s.start_time) = $${params.length}`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Get paginated results
    const dataQuery = `
      SELECT b.*, 
        s.start_time, s.end_time,
        d.name as doctor_name, d.specialization,
        u.name as user_name, u.email as user_email
      ${baseQuery}
      ORDER BY s.start_time DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await pool.query(dataQuery, params);

    return {
      bookings: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Expire pending bookings (called by cron/scheduled task)
   */
  async expirePendingBookings() {
    const result = await pool.query('SELECT expire_pending_bookings() as count');
    return result.rows[0].count;
  }
}

module.exports = new BookingService();

