import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { JWT_SECRET } from '../secret';
import { sendSMS } from '../utils/sms';

const router = Router();

function publicUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.name,
    role: user.role,
    phone: user.phone_number,
    isActive: user.is_active,
    baseSalary: user.base_salary,
    commissionRate: user.commission_rate,
  };
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase();
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE lower(email) = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    if (user.is_active === false) {
      return res.status(403).json({ error: 'This account is inactive' });
    }

    const validPassword = await bcrypt.compare(password, user.password || '');
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, display_name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: publicUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone_number, is_active, base_salary, commission_rate, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    res.json({
      ...publicUser(user),
      uid: String(user.id),
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/register', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Only admins can register users' });
    const { password, displayName, role } = req.body;
    const email = req.body.email?.toLowerCase();
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const existing = await pool.query('SELECT id FROM users WHERE lower(email) = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already exists' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password, name, role, is_active) VALUES ($1,$2,$3,$4,true)
       RETURNING id, email, name, role`,
      [email, hash, displayName || email, role || 'employee']
    );
    res.status(201).json({ ...result.rows[0], displayName: result.rows[0].name });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await pool.query('SELECT id, name, phone_number FROM users WHERE lower(email) = $1', [email]);
    if (user.rows.length === 0) return res.json({ message: 'If that account exists, a reset code was sent' });
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query('INSERT INTO otps (user_id, otp, expires_at) VALUES ($1, $2, $3)', [user.rows[0].id, otp, expires]);
    if (user.rows[0].phone_number) {
      await sendSMS(user.rows[0].phone_number, `Your reset code is ${otp}. It expires in 10 minutes.`);
    }
    res.json({ message: 'If that account exists, a reset code was sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.toLowerCase();
    const otp = String(req.body.otp || '');
    const result = await pool.query(
      `SELECT o.id FROM otps o
       JOIN users u ON u.id = o.user_id
       WHERE lower(u.email) = $1 AND o.otp = $2 AND o.expires_at > NOW()
       ORDER BY o.id DESC LIMIT 1`,
      [email, otp]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired code' });
    res.json({ valid: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.toLowerCase();
    const otp = String(req.body.otp || '');
    const newPassword = req.body.newPassword;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Email, code, and new password are required' });
    const match = await pool.query(
      `SELECT u.id, o.id AS otp_id FROM otps o
       JOIN users u ON u.id = o.user_id
       WHERE lower(u.email) = $1 AND o.otp = $2 AND o.expires_at > NOW()
       ORDER BY o.id DESC LIMIT 1`,
      [email, otp]
    );
    if (match.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired code' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hash, match.rows[0].id]);
    await pool.query('DELETE FROM otps WHERE id = $1', [match.rows[0].otp_id]);
    res.json({ message: 'Password updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
