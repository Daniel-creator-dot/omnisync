import pool from './db';

async function updateBaseUrl() {
  try {
    await pool.query("UPDATE sms_config SET base_url = 'https://sms.smsnotifygh.com/smsapi' WHERE id = 1");
    console.log('✅ SMS Base URL updated successfully to https://sms.smsnotifygh.com/smsapi');
  } catch (error) {
    console.error('❌ Failed to update Base URL:', error);
  } finally {
    pool.end();
  }
}

updateBaseUrl();
