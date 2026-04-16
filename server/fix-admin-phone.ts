import pool from './db';

async function fixAdminPhone() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const email = 'admin@omnisync.com';
    const phone = '0501602793'; // The number used in the successful debug test

    console.log(`Checking if user ${email} exists...`);
    const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userCheck.rows.length === 0) {
      console.log(`User ${email} not found. Creating...`);
      // Note: In a real scenario, we'd need a hash, but since we're fixing an existing or potential test user:
      // We'll rely on the seed script having run, or we'll just insert if it's missing (though password will be junk).
      await client.query(
        "INSERT INTO users (email, password_hash, display_name, role, phone) VALUES ($1, 'temporary_hash', 'Admin User', 'admin', $2)",
        [email, phone]
      );
    } else {
      console.log(`Updating ${email} phone to ${phone}...`);
      await client.query('UPDATE users SET phone = $1 WHERE email = $2', [phone, email]);
    }

    // Also update any employee with this email
    await client.query('UPDATE employees SET phone = $1 WHERE email = $2', [phone, email]);

    await client.query('COMMIT');
    console.log('✅ Admin user phone number updated successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to update admin phone:', error);
  } finally {
    client.release();
    pool.end();
  }
}

fixAdminPhone();
