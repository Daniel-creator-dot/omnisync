import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Accounts
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM accounts ORDER BY code');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, type, balance } = req.body;
    const result = await pool.query(
      'INSERT INTO accounts (code, name, type, balance) VALUES ($1,$2,$3,$4) RETURNING *',
      [code, name, type, balance || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM accounts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Journal Entries
router.get('/journal-entries', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM journal_entries ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/journal-entries', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { date, description, reference, lines } = req.body;
    await client.query('BEGIN');

    // 1. Insert Journal Entry
    const insertResult = await client.query(
      'INSERT INTO journal_entries (date, description, reference, lines) VALUES ($1,$2,$3,$4) RETURNING *',
      [date, description, reference, JSON.stringify(lines || [])]
    );

    // 2. Update individual account balances
    // Asset/Expense: Debit increases, Credit decreases
    // Liability/Equity/Revenue: Credit increases, Debit decreases
    for (const line of (lines || [])) {
      const accountResult = await client.query('SELECT type FROM accounts WHERE id = $1', [line.accountId]);
      if (accountResult.rows.length === 0) continue;
      
      const type = accountResult.rows[0].type;
      const amount = parseFloat(line.amount);
      let adjustment = 0;

      if (['asset', 'expense'].includes(type)) {
        adjustment = line.type === 'debit' ? amount : -amount;
      } else {
        adjustment = line.type === 'credit' ? amount : -amount;
      }

      await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [adjustment, line.accountId]);
    }

    await client.query('COMMIT');
    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Journal entry failed:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.delete('/journal-entries/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM journal_entries WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
