/**
 * Doctor Service
 * 
 * Handles doctor CRUD operations.
 */
const { pool, supabase } = require('../config/database');
const ApiError = require('../utils/ApiError');

class DoctorService {
  async create(doctorData) {
    const { 
      name, 
      email, 
      specialization, 
      qualification, 
      experience_years, 
      consultation_fee, 
      bio 
    } = doctorData;

    const result = await pool.query(
      `INSERT INTO doctors (name, email, specialization, qualification, experience_years, consultation_fee, bio)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, email, specialization, qualification, experience_years || 0, consultation_fee || 0, bio]
    );

    return result.rows[0];
  }

  async getAll({ specialization, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    
    let baseQuery = `FROM doctors d WHERE d.is_active = true`;
    const params = [];

    if (specialization) {
      params.push(specialization);
      baseQuery += ` AND d.specialization = $${params.length}`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Get paginated results
    const dataQuery = `
      SELECT d.*, 
        (SELECT COUNT(*) FROM slots s WHERE s.doctor_id = d.id AND s.is_available = true AND s.start_time > NOW()) as available_slots
      ${baseQuery}
      ORDER BY d.name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const result = await pool.query(dataQuery, params);

    return {
      doctors: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id) {
    const result = await pool.query(
      `SELECT d.*, 
        (SELECT COUNT(*) FROM slots s WHERE s.doctor_id = d.id AND s.is_available = true AND s.start_time > NOW()) as available_slots
       FROM doctors d
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('Doctor not found');
    }

    return result.rows[0];
  }

  async update(id, updateData) {
    const { name, specialization, qualification, experience_years, consultation_fee, bio, is_active } = updateData;

    const result = await pool.query(
      `UPDATE doctors 
       SET name = COALESCE($1, name),
           specialization = COALESCE($2, specialization),
           qualification = COALESCE($3, qualification),
           experience_years = COALESCE($4, experience_years),
           consultation_fee = COALESCE($5, consultation_fee),
           bio = COALESCE($6, bio),
           is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [name, specialization, qualification, experience_years, consultation_fee, bio, is_active, id]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('Doctor not found');
    }

    return result.rows[0];
  }

  async delete(id) {
    const result = await pool.query(
      'DELETE FROM doctors WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('Doctor not found');
    }

    return { message: 'Doctor deleted successfully' };
  }

  async getSpecializations() {
    const result = await pool.query(
      'SELECT DISTINCT specialization FROM doctors WHERE is_active = true ORDER BY specialization'
    );
    return result.rows.map(row => row.specialization);
  }
}

module.exports = new DoctorService();

