import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/leave-requests
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let result;
    if (req.user?.role === 'employee') {
      const emp = await pool.query('SELECT id FROM employees WHERE email = $1', [req.user.email]);
      if (emp.rows.length === 0) return res.json([]);
      result = await pool.query('SELECT * FROM leave_requests WHERE employee_id = $1 ORDER BY start_date DESC', [emp.rows[0].id]);
    } else {
      result = await pool.query('SELECT * FROM leave_requests ORDER BY start_date DESC');
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/leave-requests
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { type, startDate, endDate, reason, employeeId } = req.body;
    let targetEmployee;

    // If admin/hr and employeeId provided, look up that specific employee
    if ((req.user?.role === 'admin' || req.user?.role === 'hr') && employeeId) {
      const emp = await pool.query('SELECT id, name FROM employees WHERE id = $1', [employeeId]);
      if (emp.rows.length === 0) return res.status(404).json({ error: 'Target employee not found' });
      targetEmployee = emp.rows[0];
    } else {
      // Default to the logged-in user's employee record
      const emp = await pool.query('SELECT id, name FROM employees WHERE email = $1', [req.user?.email]);
      if (emp.rows.length === 0) return res.status(404).json({ error: 'Employee record not found for this user' });
      targetEmployee = emp.rows[0];
    }

    const result = await pool.query(
      'INSERT INTO leave_requests (employee_id, employee_name, type, start_date, end_date, reason, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [targetEmployee.id, targetEmployee.name, type, startDate, endDate, reason, 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/leave-requests/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, startDate, endDate, reason } = req.body;
    let result;
    if (status && !type) {
      // Just status update (approve/reject)
      result = await pool.query('UPDATE leave_requests SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [status, req.params.id]);
    } else {
      result = await pool.query(
        'UPDATE leave_requests SET type=$1, start_date=$2, end_date=$3, reason=$4, status=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
        [type, startDate, endDate, reason, status || 'pending', req.params.id]
      );
    }
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/leave-requests/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM leave_requests WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
