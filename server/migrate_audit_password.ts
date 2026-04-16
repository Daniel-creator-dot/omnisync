import pool from './db';
import bcrypt from 'bcryptjs';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Hashing new default password...');
    const defaultHash = await bcrypt.hash('zxcv123$$', 10);
    
    console.log('Updating existing users...');
    const res = await client.query('UPDATE users SET password_hash = $1', [defaultHash]);
    console.log(`Updated ${res.rowCount} users with the new default password.`);
    
    console.log('Creating audit_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255),
        action VARCHAR(50) NOT NULL,
        resource VARCHAR(255) NOT NULL,
        details JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query('COMMIT');
    console.log('Migration successful.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
