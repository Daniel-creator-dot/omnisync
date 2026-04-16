import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let result;
    if (req.user?.role === 'employee') {
      const emp = await pool.query('SELECT id FROM employees WHERE email = $1', [req.user.email]);
      if (emp.rows.length === 0) return res.json([]);
      result = await pool.query('SELECT * FROM timesheets WHERE employee_id = $1 ORDER BY date DESC', [emp.rows[0].id]);
    } else {
      result = await pool.query('SELECT * FROM timesheets ORDER BY date DESC');
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { date, hours, status } = req.body;
    const emp = await pool.query('SELECT id FROM employees WHERE email = $1', [req.user?.email]);
    if (emp.rows.length === 0) return res.status(404).json({ error: 'Employee record not found' });

    const result = await pool.query(
      'INSERT INTO timesheets (employee_id, date, hours, status) VALUES ($1,$2,$3,$4) RETURNING *',
      [emp.rows[0].id, date, hours, status || 'submitted']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const result = await pool.query('UPDATE timesheets SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM timesheets WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
