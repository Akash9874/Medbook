/**
 * Database Configuration
 * 
 * We use TWO connection methods:
 * 1. Supabase Client - For simple CRUD and real-time features
 * 2. PostgreSQL Pool - For transactions requiring row-level locks
 * 
 * Why both? Supabase client doesn't support transaction isolation levels
 * needed for preventing race conditions in concurrent booking scenarios.
 */
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const env = require('./env');

// Supabase client for general operations
const supabase = createClient(env.supabase.url, env.supabase.serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Parse DATABASE_URL for pg Pool
// Supabase connection strings need to be parsed into config object
function parseConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      user: url.username,
      password: decodeURIComponent(url.password),
      ssl: { rejectUnauthorized: false }
    };
  } catch (error) {
    console.error('Failed to parse DATABASE_URL:', error.message);
    console.error('DATABASE_URL value:', connectionString ? '[SET]' : '[NOT SET]');
    throw error;
  }
}

// PostgreSQL pool for transaction operations
const poolConfig = env.database.url 
  ? parseConnectionString(env.database.url)
  : { ssl: { rejectUnauthorized: false } };

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Test database connection on startup
pool.on('connect', () => {
  console.log('PostgreSQL pool connected');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = { supabase, pool };

