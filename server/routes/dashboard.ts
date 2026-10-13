import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { loadAccounts } from '../ledger';
import { bankTable, ensureBooks } from '../schema';

const router = Router();

router.get('/stats', authMiddleware, async (_req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await ensureBooks();
    const table = await bankTable();
    const [stats, departments, history, recent, banks] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COALESCE(SUM(amount), 0) FROM payments) AS collected,
          (SELECT COALESCE(SUM(amount), 0) FROM invoices) AS invoiced,
          (SELECT COUNT(*) FROM employees WHERE status = 'active') AS active_employees,
          (SELECT COUNT(*) FROM invoices WHERE status IN ('pending', 'partial', 'overdue')) AS pending_invoices,
          (SELECT COUNT(*) FROM job_postings WHERE status = 'open') AS active_postings,
          (SELECT COALESCE(SUM(net_salary), 0) FROM payroll WHERE status = 'approved') AS payroll_outstanding,
          (SELECT COALESCE(SUM(net_salary), 0) FROM payroll WHERE status = 'paid') AS payroll_paid
      `),
      pool.query('SELECT department as name, COUNT(*)::int as count FROM employees GROUP BY department'),
      pool.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE) - interval '5 months',
            date_trunc('month', CURRENT_DATE),
            interval '1 month'
          )::date AS month_start
        ),
        monthly_revenue AS (
          SELECT date_trunc('month', date)::date AS month_start, SUM(amount) AS revenue
          FROM payments
          WHERE date >= date_trunc('month', CURRENT_DATE) - interval '5 months'
          GROUP BY 1
        ),
        monthly_expenses AS (
          SELECT date_trunc('month', COALESCE(j.entry_date, j.date, j.created_at))::date AS month_start,
            SUM(l.debit - l.credit) AS expenses
          FROM journal_lines l
          JOIN journal_entries j ON j.id = l.journal_entry_id
          JOIN chart_of_accounts c ON c.id = l.account_id
          WHERE lower(c.type) = 'expense'
            AND COALESCE(j.entry_date, j.date, j.created_at) >= date_trunc('month', CURRENT_DATE) - interval '5 months'
          GROUP BY 1
        )
        SELECT to_char(m.month_start, 'Mon') AS name,
          COALESCE(r.revenue, 0)::float AS revenue,
          COALESCE(e.expenses, 0)::float AS expenses
        FROM months m
        LEFT JOIN monthly_revenue r ON m.month_start = r.month_start
        LEFT JOIN monthly_expenses e ON m.month_start = e.month_start
        ORDER BY m.month_start ASC
      `),
      pool.query(`
        SELECT j.id,
          COALESCE(j.entry_date, j.date, j.created_at::date) AS date,
          j.description,
          j.reference,
          COALESCE(SUM(l.debit), 0)::float AS amount
        FROM journal_entries j
        LEFT JOIN journal_lines l ON l.journal_entry_id = j.id
        GROUP BY j.id
        ORDER BY COALESCE(j.entry_date, j.date, j.created_at) DESC NULLS LAST, j.id DESC
        LIMIT 6
      `),
      pool.query(`SELECT COALESCE(SUM(balance), 0)::float AS total, COUNT(*)::int AS accounts FROM ${table}`),
    ]);

    const accounts = await loadAccounts(client);
    const ledgerSpend = accounts
      .filter((account) => account.type === 'expense')
      .reduce((sum, account) => sum + account.balance, 0);
    const ledgerAssets = accounts
      .filter((account) => account.type === 'asset')
      .reduce((sum, account) => sum + account.balance, 0);
    const s = stats.rows[0];

    res.json({
      totalRevenue: parseFloat(s.collected),
      invoiced: parseFloat(s.invoiced),
      totalExpenses: ledgerSpend,
      activeEmployees: parseInt(s.active_employees, 10),
      pendingInvoices: parseInt(s.pending_invoices, 10),
      activePostings: parseInt(s.active_postings, 10),
      totalAssets: ledgerAssets,
      bankCash: Number(banks.rows[0].total),
      bankAccounts: Number(banks.rows[0].accounts),
      payrollOutstanding: parseFloat(s.payroll_outstanding),
      payrollPaid: parseFloat(s.payroll_paid),
      departmentDistribution: departments.rows,
      monthlyHistory: history.rows,
      recent: recent.rows.map((row) => ({
        id: row.id,
        date: row.date,
        label: row.description || 'Journal entry',
        detail: row.reference || 'Ledger',
        amount: Number(row.amount),
      })),
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

export default router;
