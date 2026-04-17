import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendSMS } from '../utils/sms';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'omnisync-secret-key-2024';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase();
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, display_name: user.display_name, department: user.department },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        department: user.department,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/register
router.post('/register', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can register users' });
    }

    const { password, displayName, role, department } = req.body;
    const email = req.body.email?.toLowerCase();
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, display_name, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, display_name, role, department',
      [email, hash, displayName || email, role || 'employee', department || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT id, email, display_name, role, department, created_at FROM users WHERE id = $1', [req.user?.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const u = result.rows[0];
    res.json({
      id: u.id,
      uid: u.id.toString(),
      email: u.email,
      displayName: u.display_name,
      role: u.role,
      department: u.department,
      createdAt: u.created_at,
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.toLowerCase()?.trim();
    if (!email) return res.status(400).json({ error: 'Email required' });

    console.log(`[Auth] Forgot password checkout for email: "${email}"`);

    const userResult = await pool.query('SELECT display_name, phone FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      console.warn(`[Auth] Forgot password requested for non-existent email: ${email}`);
      // For security, don't reveal if user exists. 
      return res.json({ success: true, message: 'If email exists and has a phone number, an OTP has been sent.' });
    }

    const { phone, display_name } = userResult.rows[0];
    if (!phone) {
      console.warn(`[Auth] No phone found for user: ${email}`);
      return res.status(400).json({ error: 'No phone number associated with this account. Please contact HR.' });
    }

    console.log(`[Auth] Found user: ${display_name}, Phone: ${phone}`);

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete existing OTPs for this email to avoid clutter
    await pool.query('DELETE FROM password_reset_otps WHERE email = $1', [email]);
    
    // Store new OTP
    await pool.query(
      'INSERT INTO password_reset_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    // Send SMS
    const maskedPhone = phone.replace(/(\d{3})\d+(\d{3})/, '$1****$2');
    console.log(`[Auth] Attempting password reset SMS for ${email} to ${maskedPhone} with OTP: ${otp}`);

    const sent = await sendSMS(phone, `Hello ${display_name}, your OmniSync reset code is: ${otp}. Valid for 10 mins.`);
    
    if (!sent) {
      console.error(`[Auth] Failed to send SMS to ${maskedPhone}. OTP was: ${otp}`);
      return res.status(502).json({ 
        error: 'Failed to send SMS OTP. The SMS gateway might be down or unconfigured.',
        details: 'For developers: Check server logs for the OTP.'
      });
    }

    res.json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.toLowerCase()?.trim();
    const { otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const result = await pool.query(
      'SELECT * FROM password_reset_otps WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    res.json({ success: true, message: 'OTP verified.' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.toLowerCase()?.trim();
    const { otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Missing fields' });

    // Verify OTP again just to be sure
    const otpCheck = await pool.query(
      'SELECT id FROM password_reset_otps WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
      [email, otp]
    );

    if (otpCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired session' });
    }

    // Update password
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);

    // Cleanup OTP
    await pool.query('DELETE FROM password_reset_otps WHERE email = $1', [email]);

    res.json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
