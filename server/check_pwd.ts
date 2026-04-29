import pool from './db';
import bcrypt from 'bcryptjs';

async function check() {
  const result = await pool.query('SELECT email, password_hash FROM users LIMIT 1');
  if (result.rows.length > 0) {
    const user = result.rows[0];
    const isZxcv = await bcrypt.compare('zxcv123$$', user.password_hash);
    console.log('Is password zxcv123$$?', isZxcv);
    console.log('Email:', user.email);
  } else {
    console.log('No users found');
  }
  pool.end();
}

check();
