import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Bank Accounts
router.get('/accounts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM bank_accounts ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/accounts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, accountNumber, bankName, currency, balance } = req.body;
    const result = await pool.query(
      'INSERT INTO bank_accounts (name, account_number, bank_name, currency, balance) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, accountNumber, bankName, currency || 'USD', balance || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/accounts/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM bank_accounts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Bank Transfers
router.get('/transfers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM bank_transfers ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/transfers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { fromAccountId, toAccountId, amount, date, description } = req.body;
    const result = await pool.query(
      'INSERT INTO bank_transfers (from_account_id, to_account_id, amount, date, description) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [fromAccountId, toAccountId, amount, date, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
