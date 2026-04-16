import pool from './db';
import { sendSMS } from './utils/sms';

async function debugFlow() {
  const email = 'Admin@OmniSync.Com'; // Mixed case to test normalization
  try {
    const normalizedEmail = email.toLowerCase();
    const result = await pool.query('SELECT display_name, phone FROM users WHERE email = $1', [normalizedEmail]);
    if (result.rows.length === 0) {
      console.log('User not found');
      return;
    }
    const { phone, display_name } = result.rows[0];
    console.log(`User: ${display_name}, Phone in DB: ${phone}`);

    const otp = '123456';
    const message = `Hello ${display_name}, your OmniSync reset code is: ${otp}. Valid for 10 mins.`;
    
    console.log(`Attempting to send real OTP message to ${phone}...`);
    const sent = await sendSMS(phone, message);
    console.log('Result:', sent ? 'Success' : 'Failure');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

debugFlow();
