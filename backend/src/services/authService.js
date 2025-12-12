/**
 * Authentication Service
 * 
 * Handles user registration, login, and token management.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

class AuthService {
  async register({ email, password, name, phone }) {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw ApiError.conflict('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, phone, role)
       VALUES ($1, $2, $3, $4, 'USER')
       RETURNING id, email, name, phone, role, created_at`,
      [email.toLowerCase(), passwordHash, name, phone]
    );

    const user = result.rows[0];
    const token = this.generateToken(user);

    return { user, token };
  }

  async login({ email, password }) {
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user);

    // Remove password from response
    delete user.password_hash;

    return { user, token };
  }

  generateToken(user) {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );
  }

  async getProfile(userId) {
    const result = await pool.query(
      'SELECT id, email, name, phone, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('User not found');
    }

    return result.rows[0];
  }
}

module.exports = new AuthService();

