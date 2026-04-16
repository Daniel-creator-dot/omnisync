import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET all exit records
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM exit_management ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// GET single exit record
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM exit_management WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

// POST create exit record
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, employeeName, department, position, exitType, exitDate, lastWorkingDay, noticePeriod, reason } = req.body;
    const result = await pool.query(
      `INSERT INTO exit_management (employee_id, employee_name, department, position, exit_type, exit_date, last_working_day, notice_period, reason) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [employeeId, employeeName, department, position, exitType || 'resignation', exitDate, lastWorkingDay, noticePeriod || 30, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// PUT update exit record
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { exitInterviewDone, exitInterviewNotes, assetsReturned, finalSettlementAmount, finalSettlementPaid, status, lastWorkingDay, reason } = req.body;
    const fieldMap: Record<string, string> = {
      exitInterviewDone: 'exit_interview_done', exitInterviewNotes: 'exit_interview_notes',
      assetsReturned: 'assets_returned', finalSettlementAmount: 'final_settlement_amount',
      finalSettlementPaid: 'final_settlement_paid', status: 'status',
      lastWorkingDay: 'last_working_day', reason: 'reason'
    };
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, col] of Object.entries(fieldMap)) {
      if (req.body[key] !== undefined) { fields.push(`${col}=$${idx++}`); values.push(req.body[key]); }
    }
    if (fields.length === 0) return res.status(400).json({ error: 'Nothing to update' });
    fields.push('updated_at=NOW()');
    values.push(req.params.id);
    const result = await pool.query(`UPDATE exit_management SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// DELETE
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { await pool.query('DELETE FROM exit_management WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: 'Server error' }); }
});

export default router;
