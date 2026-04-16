import pool from '../db';

export async function sendSMS(to: string, message: string) {
  try {
    const configResult = await pool.query('SELECT * FROM sms_config WHERE id = 1');
    const config = configResult.rows[0];

    if (!config || !config.is_active) {
      console.warn('SMS configuration missing or inactive. Message not sent.');
      return false;
    }

    const { base_url, sender_id, api_key, provider, api_secret } = config;

    // Sanitize phone: Remove spaces, dashes, parentheses and leading +
    // Ghanian gateways usually prefer raw digits (e.g. 050... or 23350...)
    const cleanTo = to.replace(/\D/g, '');

    // Format: base_url?key=xxxxxxxxxx&to=xxxxxxx&msg=xxxxxxxx&sender_id=xxxxx
    const params = new URLSearchParams({
      key: api_key || '',
      to: cleanTo,
      msg: message,
      sender_id: sender_id || ''
    });

    const url = `${base_url}?${params.toString()}`;
    const maskedTo = cleanTo.slice(0, 3) + '****' + cleanTo.slice(-3);
    
    console.log(`Sending SMS to ${maskedTo} via ${provider || 'Gateway'}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: api_key ? { 'Authorization': `Bearer ${api_key}` } : {}
    });

    const body = await response.text();

    if (!response.ok) {
      console.error(`❌ SMS Provider error (${response.status}):`, body);
      return false;
    }

    console.log(`✅ SMS Gateway Response:`, body);
    return true;
  } catch (error) {
    console.error('❌ Failed to send SMS:', error);
    return false;
  }
}
