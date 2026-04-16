import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/payroll - list all payroll records, optionally filter by month/year
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;
    let query = 'SELECT * FROM payroll';
    const params: any[] = [];
    const conditions: string[] = [];

    // Filter by current employee if role is 'employee'
    if (req.user?.role === 'employee') {
      const emp = await pool.query('SELECT id FROM employees WHERE email = $1', [req.user.email]);
      if (emp.rows.length === 0) return res.json([]); // No linked employee record
      conditions.push(`employee_id = $${params.length + 1}`);
      params.push(emp.rows[0].id);
    }

    if (month && year) {
      conditions.push(`month = $${params.length + 1}`);
      params.push(month);
      conditions.push(`year = $${params.length + 1}`);
      params.push(year);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY year DESC, month DESC, employee_name ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/payroll/periods - get distinct processed periods
router.get('/periods', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT month, year, COUNT(*)::int as employee_count, SUM(net_salary)::numeric as total_net FROM payroll GROUP BY month, year ORDER BY year DESC, month DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/payroll/run-batch - run payroll for ALL active employees for a given month/year
router.post('/run-batch', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, bonusPercent = 0, deductionPercent = 0 } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Month and year are required' });

    // Check if payroll already exists for this period
    const existing = await pool.query('SELECT id FROM payroll WHERE month=$1 AND year=$2 LIMIT 1', [month, year]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: `Payroll already processed for ${month}/${year}. Delete first to re-run.` });
    }

    // Fetch all active employees
    const employees = await pool.query("SELECT id, name, salary FROM employees WHERE status = 'active'");
    if (employees.rows.length === 0) {
      return res.status(400).json({ error: 'No active employees found' });
    }

    const records: any[] = [];
    for (const emp of employees.rows) {
      const baseSalary = parseFloat(emp.salary) || 0;
      const bonuses = baseSalary * (bonusPercent / 100);
      const deductions = baseSalary * (deductionPercent / 100);
      const netSalary = baseSalary + bonuses - deductions;

      const result = await pool.query(
        'INSERT INTO payroll (employee_id, employee_name, month, year, base_salary, bonuses, deductions, net_salary, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
        [emp.id, emp.name, month, year, baseSalary, bonuses, deductions, netSalary, 'pending']
      );
      records.push(result.rows[0]);
    }

    res.status(201).json({ message: `Payroll processed for ${records.length} employees`, records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/payroll/approve-batch - approve all payroll records for a period
router.put('/approve-batch', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.body;
    const result = await pool.query(
      "UPDATE payroll SET status='paid' WHERE month=$1 AND year=$2 AND status='pending' RETURNING *",
      [month, year]
    );
    res.json({ message: `${result.rows.length} records approved`, records: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/payroll/period - delete all payroll records for a period
router.delete('/period', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;
    await pool.query('DELETE FROM payroll WHERE month=$1 AND year=$2', [month, year]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/payroll/:id - update individual record
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, bonuses, deductions } = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (status) { fields.push(`status=$${idx++}`); values.push(status); }
    if (bonuses !== undefined) { fields.push(`bonuses=$${idx++}`); values.push(bonuses); }
    if (deductions !== undefined) { fields.push(`deductions=$${idx++}`); values.push(deductions); }
    if (fields.length === 0) return res.status(400).json({ error: 'Nothing to update' });
    
    values.push(req.params.id);
    // Also recalculate net_salary
    const result = await pool.query(
      `UPDATE payroll SET ${fields.join(', ')}, net_salary = base_salary + COALESCE(bonuses,0) - COALESCE(deductions,0) WHERE id=$${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/payroll/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM payroll WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
