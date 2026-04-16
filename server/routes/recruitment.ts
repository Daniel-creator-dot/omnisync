import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Job Postings
router.get('/job-postings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM job_postings ORDER BY title');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/job-postings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, department, description, status } = req.body;
    const result = await pool.query(
      'INSERT INTO job_postings (title, department, description, status) VALUES ($1,$2,$3,$4) RETURNING *',
      [title, department, description, status || 'open']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/job-postings/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, department, description, status } = req.body;
    const result = await pool.query(
      'UPDATE job_postings SET title=$1, department=$2, description=$3, status=$4 WHERE id=$5 RETURNING *',
      [title, department, description, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/job-postings/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM job_postings WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Candidates
router.get('/candidates', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM candidates ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/candidates', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, jobId, status } = req.body;
    const result = await pool.query(
      'INSERT INTO candidates (name, email, job_id, status) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, email, jobId, status || 'applied']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/candidates/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const result = await pool.query('UPDATE candidates SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/candidates/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM candidates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
