import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/settings/sms
router.get('/', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM sms_config WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/settings/sms
router.post('/', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { base_url, sender_id, api_key, provider, api_secret, is_active } = req.body;
    
    // Check if row 1 exists
    const check = await pool.query('SELECT id FROM sms_config WHERE id = 1');
    
    let result;
    if (check.rows.length > 0) {
      result = await pool.query(
        'UPDATE sms_config SET base_url = $1, sender_id = $2, api_key = $3, provider = $4, api_secret = $5, is_active = $6, updated_at = NOW() WHERE id = 1 RETURNING *',
        [base_url, sender_id, api_key, provider, api_secret, is_active]
      );
    } else {
      result = await pool.query(
        'INSERT INTO sms_config (id, base_url, sender_id, api_key, provider, api_secret, is_active) VALUES (1, $1, $2, $3, $4, $5, $6) RETURNING *',
        [base_url, sender_id, api_key, provider, api_secret, is_active]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
