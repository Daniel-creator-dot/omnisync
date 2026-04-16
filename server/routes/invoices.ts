import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/invoices
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, customer_id } = req.query;
    let query = 'SELECT i.*, c.company as customer_company FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id';
    const conditions: string[] = [];
    const params: any[] = [];
    if (status) { params.push(status); conditions.push(`i.status = $${params.length}`); }
    if (customer_id) { params.push(customer_id); conditions.push(`i.customer_id = $${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY i.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invoices/next-number
router.get('/next-number', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await pool.query('SELECT invoice_prefix, invoice_next_number FROM company_settings WHERE id=1');
    const s = settings.rows[0] || { invoice_prefix: 'INV-', invoice_next_number: 1001 };
    res.json({ nextNumber: `${s.invoice_prefix}${s.invoice_next_number}` });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invoices/summary - dashboard stats
router.get('/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(amount_paid), 0) as total_paid,
        COALESCE(SUM(balance_due), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN status='overdue' THEN balance_due ELSE 0 END), 0) as total_overdue,
        COUNT(CASE WHEN status='pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status='paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status='overdue' THEN 1 END) as overdue_count
      FROM invoices
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/invoices/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const inv = await pool.query('SELECT i.*, c.company as customer_company, c.address as customer_address, c.city as customer_city, c.state as customer_state, c.zip as customer_zip, c.email as customer_email, c.phone as customer_phone FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.id=$1', [req.params.id]);
    if (inv.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    
    // Get payments for this invoice
    const payments = await pool.query('SELECT * FROM payments WHERE invoice_id=$1 ORDER BY date DESC', [req.params.id]);
    
    // Get company settings
    const company = await pool.query('SELECT * FROM company_settings WHERE id=1');
    
    res.json({ ...inv.rows[0], payments: payments.rows, company: company.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { invoiceNumber, customerId, clientName, items, subtotal, taxRate, taxAmount, discount, amount, notes, terms, dueDate, issueDate } = req.body;
    const balanceDue = amount;

    const result = await pool.query(
      `INSERT INTO invoices (invoice_number, customer_id, client_name, items, subtotal, tax_rate, tax_amount, discount, amount, balance_due, amount_paid, notes, terms, due_date, issue_date, status) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,$11,$12,$13,$14,'pending') RETURNING *`,
      [invoiceNumber, customerId || null, clientName, JSON.stringify(items || []), subtotal || 0, taxRate || 0, taxAmount || 0, discount || 0, amount, balanceDue, notes || '', terms || '', dueDate, issueDate || new Date().toISOString().split('T')[0]]
    );

    // Increment invoice number
    await pool.query('UPDATE company_settings SET invoice_next_number = invoice_next_number + 1 WHERE id=1');

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/invoices/:id/payment - record a payment and update GL
router.post('/:id/payment', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { amount, date, method, reference, notes } = req.body;
    const invoiceId = req.params.id;
    const paymentAmount = parseFloat(amount);

    await client.query('BEGIN');

    // 1. Insert payment record
    await client.query(
      'INSERT INTO payments (invoice_id, amount, date, method, reference, notes) VALUES ($1,$2,$3,$4,$5,$6)',
      [invoiceId, paymentAmount, date || new Date().toISOString().split('T')[0], method || 'check', reference || '', notes || '']
    );

    // 2. Update invoice totals and status
    const paymentsResult = await client.query('SELECT COALESCE(SUM(amount),0) as total_paid FROM payments WHERE invoice_id=$1', [invoiceId]);
    const totalPaid = parseFloat(paymentsResult.rows[0].total_paid);
    
    const invoiceResult = await client.query('SELECT amount FROM invoices WHERE id=$1', [invoiceId]);
    const invoiceAmount = parseFloat(invoiceResult.rows[0].amount);
    const balanceDue = invoiceAmount - totalPaid;
    const newStatus = balanceDue <= 0 ? 'paid' : 'partial';

    await client.query('UPDATE invoices SET amount_paid=$1, balance_due=$2, status=$3 WHERE id=$4', [totalPaid, Math.max(0, balanceDue), newStatus, invoiceId]);

    // 3. Update General Ledger (Cash increase, AR decrease)
    // Account 1000 - Cash (Asset, Debit+)
    // Account 1100 - Accounts Receivable (Asset, Credit-)
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE code = $2', [paymentAmount, '1000']);
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE code = $2', [paymentAmount, '1100']);

    // 4. Create Journal Entry for audit trail
    const jeLines = [
      { accountId: (await client.query("SELECT id FROM accounts WHERE code='1000'")).rows[0]?.id, accountName: 'Cash', type: 'debit', amount: paymentAmount },
      { accountId: (await client.query("SELECT id FROM accounts WHERE code='1100'")).rows[0]?.id, accountName: 'Accounts Receivable', type: 'credit', amount: paymentAmount }
    ];
    await client.query(
      'INSERT INTO journal_entries (date, description, reference, lines) VALUES ($1,$2,$3,$4)',
      [date || new Date().toISOString().split('T')[0], `Payment for Invoice #${invoiceId}`, reference || `PAY-${invoiceId}`, JSON.stringify(jeLines)]
    );

    await client.query('COMMIT');
    res.json({ message: 'Payment recorded and ledger updated', totalPaid, balanceDue: Math.max(0, balanceDue), status: newStatus });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/invoices/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status, clientName, items, subtotal, taxRate, taxAmount, discount, amount, notes, terms, dueDate } = req.body;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (status) { fields.push(`status=$${idx++}`); values.push(status); }
    if (clientName) { fields.push(`client_name=$${idx++}`); values.push(clientName); }
    if (items) { fields.push(`items=$${idx++}`); values.push(JSON.stringify(items)); }
    if (subtotal !== undefined) { fields.push(`subtotal=$${idx++}`); values.push(subtotal); }
    if (taxRate !== undefined) { fields.push(`tax_rate=$${idx++}`); values.push(taxRate); }
    if (taxAmount !== undefined) { fields.push(`tax_amount=$${idx++}`); values.push(taxAmount); }
    if (discount !== undefined) { fields.push(`discount=$${idx++}`); values.push(discount); }
    if (amount !== undefined) { fields.push(`amount=$${idx++}`); values.push(amount); fields.push(`balance_due=$${idx++}`); values.push(amount - (req.body.amountPaid || 0)); }
    if (notes !== undefined) { fields.push(`notes=$${idx++}`); values.push(notes); }
    if (terms !== undefined) { fields.push(`terms=$${idx++}`); values.push(terms); }
    if (dueDate) { fields.push(`due_date=$${idx++}`); values.push(dueDate); }
    if (fields.length === 0) return res.status(400).json({ error: 'Nothing to update' });
    
    values.push(req.params.id);
    const result = await pool.query(`UPDATE invoices SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
