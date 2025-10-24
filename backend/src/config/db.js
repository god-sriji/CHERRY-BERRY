import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to execute queries
export const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper function to execute queries and return first row
export const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};

// Test connection
export const testConnection = async () => {
  try {
    await pool.query('SELECT 1');
    console.log(' Database connected');
  } catch (error) {
    console.error(' Database connection failed:', error);
    throw error;
  }
};

// Initialize database schema (keep existing migration logic)
export const syncDatabase = async () => {
  try {
    const { initializeSchema } = await import('../migrations/001-init-schema.js');
    await initializeSchema();
    console.log(' Database synced');
  } catch (error) {
    console.error(' Database sync failed:', error);
    throw error;
  }
};

export default pool;
