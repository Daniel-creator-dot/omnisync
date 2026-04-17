import pool from './db';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Adding phone column to users and employees tables...');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
    await client.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');

    console.log('Creating sms_config table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sms_config (
        id SERIAL PRIMARY KEY,
        base_url TEXT NOT NULL,
        sender_id VARCHAR(50) NOT NULL,
        api_key TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Insert a default row if not exists
    await client.query(`
      INSERT INTO sms_config (id, base_url, sender_id)
      SELECT 1, 'https://sms.smsnotifygh.com/smsapi', 'BytzForge'
      WHERE NOT EXISTS (SELECT 1 FROM sms_config WHERE id = 1)
    `);

    console.log('Creating password_reset_otps table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Migration for Forgot Password & SMS Config successful!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
