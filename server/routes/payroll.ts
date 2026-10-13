import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { JournalError, postJournal } from '../ledger';
import { bankTable, ensureBooks } from '../schema';

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

// GET /api/payroll/periods - get distinct processed periods with status counts
router.get('/periods', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        month, 
        year, 
        COUNT(*)::int as employee_count, 
        SUM(net_salary)::numeric as total_net,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::int as approved_count,
        COUNT(CASE WHEN status = 'paid' THEN 1 END)::int as paid_count
      FROM payroll 
      GROUP BY month, year 
      ORDER BY year DESC, month DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/payroll/run-batch - run payroll for selected (or all active) employees for a given month/year
router.post('/run-batch', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, bonusPercent = 0, deductionPercent = 0, employeeIds } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Month and year are required' });

    // Check if payroll already exists for the selected/all employees for this period
    let checkQuery = 'SELECT id, employee_name FROM payroll WHERE month = $1 AND year = $2';
    const checkParams: any[] = [month, year];
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      checkQuery += ' AND employee_id = ANY($3)';
      checkParams.push(employeeIds);
    }

    const existing = await pool.query(checkQuery, checkParams);
    if (existing.rows.length > 0) {
      const names = existing.rows.map(r => r.employee_name).join(', ');
      return res.status(400).json({ 
        error: `Payroll already processed for some employees (${names}) in ${month}/${year}. Delete existing records first.` 
      });
    }

    // Fetch active employees (filtered by employeeIds if provided)
    let empQuery = "SELECT id, name, salary, deduction_type, deduction_value FROM employees WHERE status = 'active'";
    const empParams: any[] = [];
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      empQuery += ' AND id = ANY($1)';
      empParams.push(employeeIds);
    } else if (employeeIds && Array.isArray(employeeIds) && employeeIds.length === 0) {
      return res.status(400).json({ error: 'At least one employee must be selected' });
    }

    const employees = await pool.query(empQuery, empParams);
    if (employees.rows.length === 0) {
      return res.status(400).json({ error: 'No active employees found matching criteria' });
    }

    const records: any[] = [];
    for (const emp of employees.rows) {
      const baseSalary = parseFloat(emp.salary) || 0;
      const bonuses = baseSalary * (bonusPercent / 100);
      
      // Calculate general deduction
      const baseDeductions = baseSalary * (deductionPercent / 100);
      
      // Calculate employee-specific deduction
      const empDeductionType = emp.deduction_type || 'none';
      const empDeductionVal = parseFloat(emp.deduction_value) || 0;
      let specificDeduction = 0;
      if (empDeductionType === 'percentage') {
        specificDeduction = baseSalary * (empDeductionVal / 100);
      } else if (empDeductionType === 'raw') {
        specificDeduction = empDeductionVal;
      }
      
      const totalDeductions = baseDeductions + specificDeduction;
      const netSalary = baseSalary + bonuses - totalDeductions;

      const result = await pool.query(
        'INSERT INTO payroll (employee_id, employee_name, month, year, base_salary, bonuses, deductions, net_salary, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
        [emp.id, emp.name, month, year, baseSalary, bonuses, totalDeductions, netSalary, 'pending']
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
      "UPDATE payroll SET status='approved' WHERE month=$1 AND year=$2 AND status='pending' RETURNING *",
      [month, year]
    );
    res.json({ message: `${result.rows.length} records approved`, records: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

async function salaryAccount(client: { query: typeof pool.query }, requestedId?: number) {
  if (requestedId) {
    const existing = await client.query('SELECT id, name FROM chart_of_accounts WHERE id = $1', [requestedId]);
    if (existing.rows.length === 0) throw new JournalError('The salary account does not exist');
    return existing.rows[0];
  }
  const named = await client.query(
    `SELECT id, name FROM chart_of_accounts
     WHERE lower(type) = 'expense' AND name ~* 'salary|wage|payroll'
     ORDER BY code LIMIT 1`
  );
  if (named.rows[0]) return named.rows[0];
  const existingCode = await client.query(`SELECT id, name FROM chart_of_accounts WHERE code = '5510' LIMIT 1`);
  if (existingCode.rows[0]) return existingCode.rows[0];
  const created = await client.query(
    `INSERT INTO chart_of_accounts (code, name, type, balance)
     VALUES ('5510', 'Salaries and Wages', 'expense', 0)
     RETURNING id, name`
  );
  return created.rows[0];
}

// PUT /api/payroll/pay-batch - pay approved slips, post the ledger, and reduce the bank balance
router.put('/pay-batch', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { month, year, paidFromAccountId, salaryAccountId, bankAccountId } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'Month and year are required' });
    if (!paidFromAccountId) return res.status(400).json({ error: 'Choose the ledger account the wages are paid from' });
    if (!bankAccountId) return res.status(400).json({ error: 'Choose the bank account to pay from' });

    await ensureBooks();
    await client.query('BEGIN');
    const slips = await client.query(
      `SELECT id, employee_name, net_salary FROM payroll
       WHERE month = $1 AND year = $2 AND status = 'approved'
       ORDER BY employee_name
       FOR UPDATE`,
      [month, year]
    );
    if (slips.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'There are no approved payslips left to pay for that period' });
    }
    const total = Math.round(slips.rows.reduce((sum, row) => sum + Number(row.net_salary || 0), 0) * 100) / 100;
    const label = `${monthNames[Number(month) - 1] || month} ${year}`;
    let journalId: number | null = null;
    if (total > 0) {
      const salary = await salaryAccount(client, salaryAccountId ? Number(salaryAccountId) : undefined);
      const paidFrom = await client.query('SELECT id, name FROM chart_of_accounts WHERE id = $1', [paidFromAccountId]);
      if (paidFrom.rows.length === 0) throw new JournalError('The paying ledger account does not exist');
      if (Number(paidFrom.rows[0].id) === Number(salary.id)) throw new JournalError('Pay wages from a cash or bank account');
      const entry = await postJournal(client, {
        date: new Date().toISOString().slice(0, 10),
        description: `Payroll ${label}`,
        reference: `PAYROLL-${year}-${String(month).padStart(2, '0')}`,
        lines: [
          { accountId: salary.id, accountName: salary.name, type: 'debit', amount: total },
          { accountId: paidFrom.rows[0].id, accountName: paidFrom.rows[0].name, type: 'credit', amount: total },
        ],
      });
      journalId = entry.id;
      const table = await bankTable();
      const bank = await client.query(
        `UPDATE ${table} SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING id, name, balance`,
        [total, bankAccountId]
      );
      if (bank.rows.length === 0) throw new JournalError('That bank account does not have enough to cover this payroll');
    }
    const paid = await client.query(
      `UPDATE payroll SET status = 'paid' WHERE month = $1 AND year = $2 AND status = 'approved' RETURNING *`,
      [month, year]
    );
    await client.query('COMMIT');
    res.json({
      message: total > 0
        ? `Paid ${paid.rows.length} people for ${label}. ${total.toFixed(2)} left the bank and was posted to the ledger.`
        : `Marked ${paid.rows.length} zero payslips as paid for ${label}.`,
      total,
      journalId,
      records: paid.rows,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(error);
    const status = error instanceof JournalError ? error.status : 500;
    res.status(status).json({ error: error instanceof JournalError ? error.message : 'Server error' });
  } finally {
    client.release();
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
