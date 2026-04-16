import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let result;
    if (req.user?.role === 'employee') {
      result = await pool.query('SELECT * FROM expenses WHERE submitted_by = $1 ORDER BY date DESC', [req.user.id]);
    } else {
      result = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { category, amount, date, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO expenses (category, amount, date, description, status, submitted_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [category, amount, date, description, status || 'pending', req.user?.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { category, amount, date, description, status } = req.body;
    const result = await pool.query(
      'UPDATE expenses SET category=$1, amount=$2, date=$3, description=$4, status=$5 WHERE id=$6 RETURNING *',
      [category, amount, date, description, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
