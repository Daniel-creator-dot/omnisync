import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ============ PAYROLL SETTINGS ============
router.get('/payroll-settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { res.json((await pool.query('SELECT * FROM payroll_settings ORDER BY id')).rows); } catch { res.status(500).json({ error: 'Server error' }); }
});
router.post('/payroll-settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { const { name, type, value, description } = req.body; res.status(201).json((await pool.query('INSERT INTO payroll_settings (name,type,value,description) VALUES ($1,$2,$3,$4) RETURNING *', [name, type||'percentage', value, description])).rows[0]); } catch { res.status(500).json({ error: 'Server error' }); }
});
router.delete('/payroll-settings/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { await pool.query('DELETE FROM payroll_settings WHERE id=$1', [req.params.id]); res.json({ success: true }); } catch { res.status(500).json({ error: 'Server error' }); }
});

// ============ DEPARTMENTS ============
router.get('/departments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { res.json((await pool.query('SELECT * FROM departments ORDER BY name')).rows); } catch { res.status(500).json({ error: 'Server error' }); }
});
router.post('/departments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { res.status(201).json((await pool.query('INSERT INTO departments (name) VALUES ($1) RETURNING *', [req.body.name])).rows[0]); } catch { res.status(500).json({ error: 'Server error' }); }
});
router.delete('/departments/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { await pool.query('DELETE FROM departments WHERE id=$1', [req.params.id]); res.json({ success: true }); } catch { res.status(500).json({ error: 'Server error' }); }
});

// ============ POLICIES ============
router.get('/policies', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { res.json((await pool.query('SELECT * FROM policies ORDER BY title')).rows); } catch { res.status(500).json({ error: 'Server error' }); }
});
router.post('/policies', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { const { title, content, category } = req.body; res.status(201).json((await pool.query('INSERT INTO policies (title,content,category) VALUES ($1,$2,$3) RETURNING *', [title, content, category])).rows[0]); } catch { res.status(500).json({ error: 'Server error' }); }
});
router.delete('/policies/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { await pool.query('DELETE FROM policies WHERE id=$1', [req.params.id]); res.json({ success: true }); } catch { res.status(500).json({ error: 'Server error' }); }
});

// ============ FISCAL YEARS ============
router.get('/fiscal-years', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { res.json((await pool.query('SELECT * FROM fiscal_years ORDER BY start_date DESC')).rows); } catch { res.status(500).json({ error: 'Server error' }); }
});
router.post('/fiscal-years', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { const { name, startDate, endDate } = req.body; res.status(201).json((await pool.query('INSERT INTO fiscal_years (name,start_date,end_date) VALUES ($1,$2,$3) RETURNING *', [name, startDate, endDate])).rows[0]); } catch { res.status(500).json({ error: 'Server error' }); }
});
router.delete('/fiscal-years/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { await pool.query('DELETE FROM fiscal_years WHERE id=$1', [req.params.id]); res.json({ success: true }); } catch { res.status(500).json({ error: 'Server error' }); }
});

// ============ COMPANY SETTINGS ============
router.get('/company', authMiddleware, async (req: AuthRequest, res: Response) => {
  try { res.json((await pool.query('SELECT * FROM company_settings WHERE id=1')).rows[0] || {}); } catch { res.status(500).json({ error: 'Server error' }); }
});
router.put('/company', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { companyName, address, city, state, zip, phone, email, website, taxId, invoicePrefix, paymentTerms, defaultNotes, currency } = req.body;
    const result = await pool.query(
      `UPDATE company_settings SET company_name=COALESCE($1,company_name), address=COALESCE($2,address), city=COALESCE($3,city), state=COALESCE($4,state), zip=COALESCE($5,zip), phone=COALESCE($6,phone), email=COALESCE($7,email), website=COALESCE($8,website), tax_id=COALESCE($9,tax_id), invoice_prefix=COALESCE($10,invoice_prefix), payment_terms=COALESCE($11,payment_terms), default_notes=COALESCE($12,default_notes), currency=COALESCE($13,currency), updated_at=NOW() WHERE id=1 RETURNING *`,
      [companyName, address, city, state, zip, phone, email, website, taxId, invoicePrefix, paymentTerms, defaultNotes, currency]
    );
    res.json(result.rows[0]);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// ============ FINANCIAL REPORTS ============
// Profit & Loss
router.get('/reports/profit-loss', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const revenue = await pool.query("SELECT COALESCE(SUM(amount_paid),0) as total FROM invoices WHERE status IN ('paid','partial')");
    const expenses = await pool.query("SELECT category, COALESCE(SUM(amount),0) as total FROM expenses WHERE status='approved' GROUP BY category ORDER BY total DESC");
    const totalExpenses = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE status='approved'");
    const payrollCosts = await pool.query("SELECT COALESCE(SUM(net_salary),0) as total FROM payroll WHERE status='paid'");

    const totalRev = parseFloat(revenue.rows[0].total);
    const totalExp = parseFloat(totalExpenses.rows[0].total) + parseFloat(payrollCosts.rows[0].total);

    res.json({
      revenue: totalRev,
      expensesByCategory: expenses.rows,
      operatingExpenses: parseFloat(totalExpenses.rows[0].total),
      payrollCosts: parseFloat(payrollCosts.rows[0].total),
      totalExpenses: totalExp,
      netIncome: totalRev - totalExp,
    });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// Balance Sheet
router.get('/reports/balance-sheet', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const assets = await pool.query("SELECT type, COALESCE(SUM(balance),0) as total FROM accounts WHERE type='asset' GROUP BY type");
    const liabilities = await pool.query("SELECT type, COALESCE(SUM(balance),0) as total FROM accounts WHERE type='liability' GROUP BY type");
    const equity = await pool.query("SELECT type, COALESCE(SUM(balance),0) as total FROM accounts WHERE type='equity' GROUP BY type");
    const receivables = await pool.query("SELECT COALESCE(SUM(balance_due),0) as total FROM invoices WHERE status IN ('pending','partial','overdue')");
    const payables = await pool.query("SELECT COALESCE(SUM(amount - COALESCE(amount_paid,0)),0) as total FROM bills WHERE status='pending'");
    const fixedAssets = await pool.query("SELECT COALESCE(SUM(value),0) as total FROM assets");
    const bankBalance = await pool.query("SELECT COALESCE(SUM(balance),0) as total FROM bank_accounts");

    res.json({
      assets: {
        cash: parseFloat(bankBalance.rows[0].total),
        accountsReceivable: parseFloat(receivables.rows[0].total),
        fixedAssets: parseFloat(fixedAssets.rows[0].total),
        otherAssets: parseFloat(assets.rows[0]?.total || 0),
      },
      liabilities: {
        accountsPayable: parseFloat(payables.rows[0].total),
        otherLiabilities: parseFloat(liabilities.rows[0]?.total || 0),
      },
      equity: parseFloat(equity.rows[0]?.total || 0),
    });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// Cash Flow Statement
router.get('/reports/cash-flow', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const invoicePayments = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM payments");
    const expensesPaid = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE status='approved'");
    const payrollPaid = await pool.query("SELECT COALESCE(SUM(net_salary),0) as total FROM payroll WHERE status='paid'");
    const bankBalance = await pool.query("SELECT COALESCE(SUM(balance),0) as total FROM bank_accounts");

    const cashIn = parseFloat(invoicePayments.rows[0].total);
    const cashOutExpenses = parseFloat(expensesPaid.rows[0].total);
    const cashOutPayroll = parseFloat(payrollPaid.rows[0].total);
    const cashOut = cashOutExpenses + cashOutPayroll;

    res.json({
      operating: {
        cashIn,
        cashOutExpenses,
        cashOutPayroll,
        cashOut,
        net: cashIn - cashOut,
      },
      bankBalance: parseFloat(bankBalance.rows[0].total),
      netCashFlow: cashIn - cashOut,
    });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// AR Aging Report
router.get('/reports/ar-aging', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await pool.query(`
      SELECT invoice_number, client_name, amount, balance_due, due_date, status, 
        CASE 
          WHEN due_date IS NULL THEN 'current'
          WHEN CURRENT_DATE - due_date <= 0 THEN 'current'
          WHEN CURRENT_DATE - due_date BETWEEN 1 AND 30 THEN '1-30'
          WHEN CURRENT_DATE - due_date BETWEEN 31 AND 60 THEN '31-60'
          WHEN CURRENT_DATE - due_date BETWEEN 61 AND 90 THEN '61-90'
          ELSE '90+'
        END as aging_bucket
      FROM invoices WHERE status IN ('pending','partial','overdue')
      ORDER BY due_date ASC
    `);

    const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    invoices.rows.forEach((inv: any) => {
      const bal = parseFloat(inv.balance_due || inv.amount || 0);
      buckets[inv.aging_bucket as keyof typeof buckets] += bal;
    });

    res.json({ invoices: invoices.rows, buckets, total: Object.values(buckets).reduce((s, v) => s + v, 0) });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// AP Aging Report
router.get('/reports/ap-aging', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bills = await pool.query(`
      SELECT vendor_name, amount, COALESCE(amount_paid,0) as amount_paid, 
        amount - COALESCE(amount_paid,0) as balance, due_date, status,
        CASE 
          WHEN due_date IS NULL THEN 'current'
          WHEN CURRENT_DATE - due_date <= 0 THEN 'current'
          WHEN CURRENT_DATE - due_date BETWEEN 1 AND 30 THEN '1-30'
          WHEN CURRENT_DATE - due_date BETWEEN 31 AND 60 THEN '31-60'
          WHEN CURRENT_DATE - due_date BETWEEN 61 AND 90 THEN '61-90'
          ELSE '90+'
        END as aging_bucket
      FROM bills WHERE status = 'pending'
      ORDER BY due_date ASC
    `);

    const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    bills.rows.forEach((b: any) => {
      buckets[b.aging_bucket as keyof typeof buckets] += parseFloat(b.balance || 0);
    });

    res.json({ bills: bills.rows, buckets, total: Object.values(buckets).reduce((s, v) => s + v, 0) });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// Trial Balance
router.get('/reports/trial-balance', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const accounts = await pool.query('SELECT code, name, type, balance FROM accounts ORDER BY code');
    let totalDebits = 0;
    let totalCredits = 0;
    const rows = accounts.rows.map((a: any) => {
      const bal = parseFloat(a.balance || 0);
      const isDebit = ['asset', 'expense'].includes(a.type);
      if (isDebit) totalDebits += bal; else totalCredits += bal;
      return { ...a, debit: isDebit ? bal : 0, credit: isDebit ? 0 : bal };
    });
    res.json({ accounts: rows, totalDebits, totalCredits, isBalanced: Math.abs(totalDebits - totalCredits) < 0.01 });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// Revenue by Customer
router.get('/reports/revenue-by-customer', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT client_name, COUNT(*)::int as invoice_count, 
        COALESCE(SUM(amount),0)::numeric as total_invoiced,
        COALESCE(SUM(amount_paid),0)::numeric as total_paid,
        COALESCE(SUM(balance_due),0)::numeric as total_outstanding
      FROM invoices 
      GROUP BY client_name
      ORDER BY total_invoiced DESC
    `);
    res.json(result.rows);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// Expense Report by Category with monthly breakdown
router.get('/reports/expense-summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const byCategory = await pool.query(`
      SELECT category, COUNT(*)::int as count, COALESCE(SUM(amount),0)::numeric as total
      FROM expenses WHERE status='approved' GROUP BY category ORDER BY total DESC
    `);
    const byMonth = await pool.query(`
      SELECT TO_CHAR(date, 'YYYY-MM') as month, COALESCE(SUM(amount),0)::numeric as total
      FROM expenses WHERE status='approved' AND date IS NOT NULL
      GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month DESC LIMIT 12
    `);
    const total = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE status='approved'");
    res.json({ byCategory: byCategory.rows, byMonth: byMonth.rows, total: parseFloat(total.rows[0].total) });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

export default router;

