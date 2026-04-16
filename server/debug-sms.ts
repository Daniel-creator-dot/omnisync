import { sendSMS } from './utils/sms';
import pool from './db';

async function debugSMS() {
  try {
    console.log('Testing SMS send with current config to 0501602793...');
    const result = await sendSMS('0501602793', 'Test message from OmniSync debug script.');
    console.log('Result:', result ? 'Success' : 'Failure');
  } catch (error) {
    console.error('Crash in debug script:', error);
  } finally {
    pool.end();
  }
}

debugSMS();
