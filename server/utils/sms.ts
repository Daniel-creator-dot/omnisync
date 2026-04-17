import pool from '../db';

export async function sendSMS(to: string, message: string) {
  try {
    const configResult = await pool.query('SELECT * FROM sms_config WHERE id = 1');
    const config = configResult.rows[0];

    if (!config || !config.is_active) {
      console.warn('SMS configuration missing or inactive. Message not sent.');
      return false;
    }

    const { base_url, sender_id, api_key, provider, api_secret } = config || {};

    if (!base_url) {
      console.warn('SMS base_url is missing. Message not sent.');
      return false;
    }

    // Sanitize phone: Remove spaces, dashes, parentheses and leading +
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
    
    console.log(`[SMS] Sending to ${maskedTo} via ${provider || 'Gateway'}...`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: api_key ? { 'Authorization': `Bearer ${api_key}` } : {},
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      const body = await response.text();

      if (!response.ok) {
        console.error(`❌ [SMS] Provider error (${response.status}):`, body);
        return false;
      }

      console.log(`✅ [SMS] Success response:`, body);
      return true;
    } catch (fetchError: any) {
      console.error(`❌ [SMS] Network error:`, fetchError.message);
      return false;
    }
  } catch (error) {
    console.error('❌ [SMS] Unexpected failure:', error);
    return false;
  }
}
