import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const priorities = new Set(['low', 'normal', 'high']);

async function ensureTasksTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS desk_tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(240) NOT NULL,
      detail TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      priority VARCHAR(20) NOT NULL DEFAULT 'normal',
      due_date DATE,
      created_by INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `);
}

router.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    await ensureTasksTable();
    const result = await pool.query(
      `SELECT id, title, detail, status, priority, due_date, created_by, created_at, completed_at
       FROM desk_tasks
       ORDER BY CASE WHEN status = 'open' THEN 0 ELSE 1 END,
                CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
                due_date NULLS LAST,
                id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await ensureTasksTable();
    const title = String(req.body.title || '').trim();
    const detail = String(req.body.detail || '').trim();
    const priority = priorities.has(req.body.priority) ? req.body.priority : 'normal';
    const dueDate = req.body.dueDate || null;
    if (!title) return res.status(400).json({ error: 'A task title is required' });
    if (title.length > 240) return res.status(400).json({ error: 'Title is too long' });
    const result = await pool.query(
      `INSERT INTO desk_tasks (title, detail, priority, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, detail, status, priority, due_date, created_by, created_at, completed_at`,
      [title, detail, priority, dueDate, req.user?.id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await ensureTasksTable();
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid task' });
    const existing = await pool.query('SELECT title, priority FROM desk_tasks WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    const current = existing.rows[0];
    const status = req.body.status === 'done' ? 'done' : 'open';
    const title = req.body.title !== undefined ? String(req.body.title).trim() : current.title;
    const priority = priorities.has(req.body.priority) ? req.body.priority : current.priority;
    if (!title) return res.status(400).json({ error: 'A task title is required' });
    const result = await pool.query(
      `UPDATE desk_tasks
       SET status = $2,
           title = $3,
           priority = $4,
           completed_at = CASE WHEN $2 = 'done' THEN COALESCE(completed_at, NOW()) ELSE NULL END
       WHERE id = $1
       RETURNING id, title, detail, status, priority, due_date, created_by, created_at, completed_at`,
      [id, status, title, priority]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await ensureTasksTable();
    const id = Number(req.params.id);
    const result = await pool.query('DELETE FROM desk_tasks WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
