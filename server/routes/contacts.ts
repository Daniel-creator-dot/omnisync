import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Vendors
router.get('/vendors', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM vendors ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/vendors', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, address } = req.body;
    const result = await pool.query(
      'INSERT INTO vendors (name, email, phone, address) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, email, phone, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/vendors/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM vendors WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Customers
router.get('/customers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/customers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone } = req.body;
    const result = await pool.query(
      'INSERT INTO customers (name, email, phone) VALUES ($1,$2,$3) RETURNING *',
      [name, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/customers/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Bills
router.get('/bills', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM bills ORDER BY due_date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/bills', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { vendorId, vendorName, amount, dueDate, status } = req.body;
    const result = await pool.query(
      'INSERT INTO bills (vendor_id, vendor_name, amount, due_date, status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [vendorId, vendorName, amount, dueDate, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/bills/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const result = await pool.query('UPDATE bills SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/bills/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM bills WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
