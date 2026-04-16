import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [stats, departments, history] = await Promise.all([
      pool.query(`
        SELECT 
          (SELECT COALESCE(SUM(amount_paid), 0) FROM invoices) as total_revenue,
          (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'approved') as total_expenses,
          (SELECT COUNT(*) FROM employees WHERE status = 'active') as active_employees,
          (SELECT COUNT(*) FROM invoices WHERE status = 'pending') as pending_invoices,
          (SELECT COUNT(*) FROM job_postings WHERE status = 'open') as active_postings,
          (SELECT COALESCE(SUM(value), 0) FROM assets) as total_assets
      `),
      pool.query('SELECT department as name, COUNT(*)::int as count FROM employees GROUP BY department'),
      pool.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE) - interval '5 months',
            date_trunc('month', CURRENT_DATE),
            interval '1 month'
          )::date as month_start
        ),
        monthly_revenue AS (
          SELECT 
            date_trunc('month', issue_date)::date as month_start,
            SUM(amount_paid) as revenue
          FROM invoices
          WHERE issue_date >= date_trunc('month', CURRENT_DATE) - interval '5 months'
          GROUP BY 1
        ),
        monthly_expenses AS (
          SELECT 
            date_trunc('month', date)::date as month_start,
            SUM(amount) as expenses
          FROM expenses
          WHERE status = 'approved' AND date >= date_trunc('month', CURRENT_DATE) - interval '5 months'
          GROUP BY 1
        )
        SELECT 
          to_char(m.month_start, 'Mon') as name,
          COALESCE(r.revenue, 0)::float as revenue,
          COALESCE(e.expenses, 0)::float as expenses
        FROM months m
        LEFT JOIN monthly_revenue r ON m.month_start = r.month_start
        LEFT JOIN monthly_expenses e ON m.month_start = e.month_start
        ORDER BY m.month_start ASC;
      `)
    ]);

    const s = stats.rows[0];
    res.json({
      totalRevenue: parseFloat(s.total_revenue),
      totalExpenses: parseFloat(s.total_expenses),
      activeEmployees: parseInt(s.active_employees),
      pendingInvoices: parseInt(s.pending_invoices),
      activePostings: parseInt(s.active_postings),
      totalAssets: parseFloat(s.total_assets),
      departmentDistribution: departments.rows,
      monthlyHistory: history.rows,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
