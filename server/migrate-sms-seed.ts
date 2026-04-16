import pool from './db';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Adding extra columns to sms_config table...');
    await client.query('ALTER TABLE sms_config ADD COLUMN IF NOT EXISTS provider VARCHAR(100)');
    await client.query('ALTER TABLE sms_config ADD COLUMN IF NOT EXISTS api_secret TEXT');
    await client.query('ALTER TABLE sms_config ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE');

    console.log('Seeding user-provided SMS configuration...');
    // Data provided: SMS Notify, Key: 84c879bb..., Secret: default_api_secret, Sender: KESBRIDGE
    await client.query(`
      UPDATE sms_config 
      SET 
        provider = $1, 
        api_key = $2, 
        api_secret = $3, 
        sender_id = $4, 
        is_active = $5,
        updated_at = NOW() 
      WHERE id = 1
    `, ['SMS Notify', '84c879bb-f9f9-4666-84a8-9f70a9b238cc', 'default_api_secret', 'KESBRIDGE', true]);

    await client.query('COMMIT');
    console.log('✅ SMS configuration updated and seeded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
