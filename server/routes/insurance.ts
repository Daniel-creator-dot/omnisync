import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ensureBooks } from '../schema';

const router = Router();
router.use(authMiddleware);

function fail(res: Response, error: unknown) {
  console.error(error);
  res.status(500).json({ error: 'Server error' });
}

router.get('/clients', async (_req, res) => {
  try { res.json((await pool.query('SELECT * FROM clients ORDER BY name')).rows); }
  catch (error) { fail(res, error); }
});

router.post('/clients', async (req, res) => {
  try {
    const { name, email, phone, address, date_of_birth } = req.body;
    const result = await pool.query(
      `INSERT INTO clients (name, email, phone, address, date_of_birth)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, email, phone || null, address || null, date_of_birth || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { fail(res, error); }
});

router.delete('/clients/:id', async (req, res) => {
  try { await pool.query('DELETE FROM clients WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (error) { fail(res, error); }
});

router.get('/policies', async (_req, res) => {
  try {
    res.json((await pool.query(`
      SELECT p.*, c.name AS client_name
      FROM policies p
      LEFT JOIN clients c ON c.id = p.client_id
      ORDER BY p.expiry_date NULLS LAST, p.id DESC
    `)).rows);
  } catch (error) { fail(res, error); }
});

router.post('/policies', async (req, res) => {
  try {
    const b = req.body;
    const premium = Number(b.premium || b.premium_amt_ghs || 0);
    const percent = Number(b.commission_percent || 0);
    const expected = b.commission_expected_ghs != null ? Number(b.commission_expected_ghs) : premium * percent / 100;
    const result = await pool.query(
      `INSERT INTO policies (
        policy_number, client_id, insurance_type, class_of_business, start_date, expiry_date, status,
        premium, agent_id, insurance_company, premium_amt_ghs, commission_percent, commission_expected_ghs, net_comm
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [
        b.policy_number, b.client_id || null, b.insurance_type, b.class_of_business || null,
        b.start_date, b.expiry_date, b.status || 'Active', premium, b.agent_id || null,
        b.insurance_company || null, premium, percent, expected, expected,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { fail(res, error); }
});

router.delete('/policies/:id', async (req, res) => {
  try { await pool.query('DELETE FROM policies WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (error) { fail(res, error); }
});

router.get('/leads', async (_req, res) => {
  try { res.json((await pool.query('SELECT * FROM leads ORDER BY created_at DESC')).rows); }
  catch (error) { fail(res, error); }
});

router.post('/leads', async (req, res) => {
  try {
    const { name, email, phone, source, status, assigned_to } = req.body;
    const result = await pool.query(
      `INSERT INTO leads (name, email, phone, source, status, assigned_to) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, email, phone || null, source || null, status || 'New', assigned_to || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { fail(res, error); }
});

router.delete('/leads/:id', async (req, res) => {
  try { await pool.query('DELETE FROM leads WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (error) { fail(res, error); }
});

router.get('/products', async (_req, res) => {
  try { res.json((await pool.query('SELECT * FROM insurance_products ORDER BY insurance_type, class_of_business')).rows); }
  catch (error) { fail(res, error); }
});

router.post('/products', async (req, res) => {
  try {
    const { insurance_type, class_of_business, description, commission_rate } = req.body;
    const result = await pool.query(
      `INSERT INTO insurance_products (insurance_type, class_of_business, description, commission_rate)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [insurance_type, class_of_business, description || null, commission_rate || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { fail(res, error); }
});

router.get('/commissions', async (_req, res) => {
  try { res.json((await pool.query('SELECT * FROM commission_rates ORDER BY class_of_business')).rows); }
  catch (error) { fail(res, error); }
});

router.post('/commissions', async (req, res) => {
  try {
    const { class_of_business, agreed_rate } = req.body;
    const result = await pool.query(
      `INSERT INTO commission_rates (class_of_business, agreed_rate) VALUES ($1,$2) RETURNING *`,
      [class_of_business, agreed_rate]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { fail(res, error); }
});

router.get('/cashbook', async (_req: AuthRequest, res) => {
  try {
    await ensureBooks();
    res.json((await pool.query('SELECT * FROM cashbook_entries ORDER BY created_at DESC')).rows);
  } catch (error) { fail(res, error); }
});

router.post('/cashbook', async (req: AuthRequest, res) => {
  try {
    await ensureBooks();
    const { description, amount, type, category, agent_id } = req.body;
    const result = await pool.query(
      `INSERT INTO cashbook_entries (description, amount, type, category, agent_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [description || null, amount, type, category || null, agent_id || req.user?.id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { fail(res, error); }
});

export default router;
