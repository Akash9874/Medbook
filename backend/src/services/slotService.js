/**
 * Slot Service
 * 
 * Handles appointment slot management.
 */
const { pool } = require('../config/database');
const ApiError = require('../utils/ApiError');

class SlotService {
  async create({ doctor_id, start_time, end_time }) {
    // Validate doctor exists
    const doctorCheck = await pool.query(
      'SELECT id FROM doctors WHERE id = $1 AND is_active = true',
      [doctor_id]
    );

    if (doctorCheck.rows.length === 0) {
      throw ApiError.notFound('Doctor not found');
    }

    // Check for overlapping slots
    const overlapCheck = await pool.query(
      `SELECT id FROM slots 
       WHERE doctor_id = $1 
       AND (
         (start_time <= $2 AND end_time > $2) OR
         (start_time < $3 AND end_time >= $3) OR
         (start_time >= $2 AND end_time <= $3)
       )`,
      [doctor_id, start_time, end_time]
    );

    if (overlapCheck.rows.length > 0) {
      throw ApiError.conflict('Slot overlaps with existing slot');
    }

    const result = await pool.query(
      `INSERT INTO slots (doctor_id, start_time, end_time)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [doctor_id, start_time, end_time]
    );

    return result.rows[0];
  }

  async createBulk({ doctor_id, date, slots }) {
    // slots is an array of { start_time, end_time } for a specific date
    const results = [];
    
    for (const slot of slots) {
      try {
        const created = await this.create({
          doctor_id,
          start_time: `${date}T${slot.start_time}`,
          end_time: `${date}T${slot.end_time}`
        });
        results.push({ success: true, slot: created });
      } catch (error) {
        results.push({ success: false, error: error.message, slot });
      }
    }

    return results;
  }

  async getByDoctor(doctorId, { date, available_only = true }) {
    let query = `
      SELECT s.*, 
        CASE WHEN b.id IS NOT NULL THEN true ELSE false END as is_booked,
        b.status as booking_status
      FROM slots s
      LEFT JOIN bookings b ON s.id = b.slot_id AND b.status IN ('PENDING', 'CONFIRMED')
      WHERE s.doctor_id = $1
    `;
    const params = [doctorId];

    if (date) {
      params.push(date);
      query += ` AND DATE(s.start_time) = $${params.length}`;
    } else {
      // Only future slots by default
      query += ` AND s.start_time > NOW()`;
    }

    if (available_only) {
      query += ` AND s.is_available = true`;
    }

    query += ` ORDER BY s.start_time ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getAvailable({ doctor_id, date, start_date, end_date }) {
    let query = `
      SELECT s.*, d.name as doctor_name, d.specialization
      FROM slots s
      JOIN doctors d ON s.doctor_id = d.id
      WHERE s.is_available = true
      AND s.start_time > NOW()
    `;
    const params = [];

    if (doctor_id) {
      params.push(doctor_id);
      query += ` AND s.doctor_id = $${params.length}`;
    }

    if (date) {
      params.push(date);
      query += ` AND DATE(s.start_time) = $${params.length}`;
    } else if (start_date && end_date) {
      params.push(start_date, end_date);
      query += ` AND DATE(s.start_time) BETWEEN $${params.length - 1} AND $${params.length}`;
    }

    query += ` ORDER BY s.start_time ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async delete(id) {
    // Check if slot has active bookings
    const bookingCheck = await pool.query(
      `SELECT id FROM bookings WHERE slot_id = $1 AND status IN ('PENDING', 'CONFIRMED')`,
      [id]
    );

    if (bookingCheck.rows.length > 0) {
      throw ApiError.conflict('Cannot delete slot with active bookings');
    }

    const result = await pool.query(
      'DELETE FROM slots WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('Slot not found');
    }

    return { message: 'Slot deleted successfully' };
  }
}

module.exports = new SlotService();

