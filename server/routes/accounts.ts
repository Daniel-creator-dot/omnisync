import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { JournalError, loadAccounts, money, postJournal } from '../ledger';

const router = Router();

router.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    res.json(await loadAccounts(client));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { code, name, type, balance } = req.body;
    if (!code || !name || !type) return res.status(400).json({ error: 'Code, name, and type are required' });
    const opening = money(Number(balance || 0));
    await client.query('BEGIN');
    const inserted = await client.query(
      'INSERT INTO chart_of_accounts (code, name, type, balance) VALUES ($1, $2, $3, 0) RETURNING *',
      [code, name, String(type).toLowerCase()]
    );
    const account = inserted.rows[0];
    if (opening !== 0) {
      const equity = await client.query(
        "SELECT id, name FROM chart_of_accounts WHERE code = '3100' LIMIT 1"
      );
      if (equity.rows.length === 0 || equity.rows[0].id === account.id) {
        throw new JournalError('Opening Balance Equity (3100) is required before posting an opening balance');
      }
      const creditNormal = ['liability', 'equity', 'revenue'].includes(String(type).toLowerCase());
      const amount = Math.abs(opening);
      const lines = creditNormal
        ? [
            { accountId: equity.rows[0].id, accountName: equity.rows[0].name, type: 'debit', amount },
            { accountId: account.id, accountName: name, type: 'credit', amount },
          ]
        : [
            { accountId: account.id, accountName: name, type: 'debit', amount },
            { accountId: equity.rows[0].id, accountName: equity.rows[0].name, type: 'credit', amount },
          ];
      if (opening < 0) lines.reverse();
      await postJournal(client, {
        description: `Opening balance for ${code} ${name}`,
        reference: `OB-${code}`,
        lines,
      });
    }
    await client.query('COMMIT');
    const accounts = await loadAccounts(client);
    res.status(201).json(accounts.find((row) => row.id === account.id) || account);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(error);
    const status = error instanceof JournalError ? error.status : error?.code === '23505' ? 400 : 500;
    res.status(status).json({ error: error instanceof JournalError || error?.code === '23505' ? error.message : 'Server error' });
  } finally {
    client.release();
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const used = await pool.query('SELECT 1 FROM journal_lines WHERE account_id = $1 LIMIT 1', [req.params.id]);
    if (used.rows.length > 0) {
      return res.status(400).json({ error: 'This account has journal lines and cannot be deleted' });
    }
    await pool.query('DELETE FROM chart_of_accounts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/journal-entries', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, entry_date AS date, description, reference, lines, amount, debit_account, credit_account
      FROM journal_entries
      ORDER BY entry_date DESC NULLS LAST, id DESC
    `);
    res.json(result.rows.map((row) => ({
      ...row,
      lines: row.lines || [
        { accountName: row.debit_account, type: 'debit', amount: row.amount },
        { accountName: row.credit_account, type: 'credit', amount: row.amount },
      ],
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/journal-entries', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const entry = await postJournal(client, req.body);
    await client.query('COMMIT');
    res.status(201).json(entry);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(error);
    const status = error instanceof JournalError ? error.status : 500;
    res.status(status).json({ error: error instanceof JournalError ? error.message : 'Server error' });
  } finally {
    client.release();
  }
});

router.delete('/journal-entries/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM journal_entries WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
