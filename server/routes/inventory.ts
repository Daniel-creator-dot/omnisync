import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Products
router.get('/products', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/products', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sku, name, description, price, cost, stockLevel, category } = req.body;
    const result = await pool.query(
      'INSERT INTO products (sku, name, description, price, cost, stock_level, category) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [sku, name, description, price, cost, stockLevel, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Stock Adjustments
router.get('/stock-adjustments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM stock_adjustments ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/stock-adjustments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity, type, reason, date } = req.body;
    const result = await pool.query(
      'INSERT INTO stock_adjustments (product_id, quantity, type, reason, date) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [productId, quantity, type, reason, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
