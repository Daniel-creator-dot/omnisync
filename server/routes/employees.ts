import { Router, Response } from 'express';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

// GET /api/employees
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/employees/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/employees
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { name, email, phone, position, department, salary, joinDate, status, role } = req.body;
    
    // Insert into employees
    const empResult = await client.query(
      'INSERT INTO employees (name, email, phone, position, department, salary, join_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, email, phone, position, department, salary, joinDate, status || 'active']
    );

    // Provide immediate application access via Users table
    // with a highly secure mandated default password
    const checkUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length === 0) {
      const defaultHash = await bcrypt.hash('zxcv123$$', 10);
      await client.query(
        'INSERT INTO users (email, password_hash, display_name, role, department, phone) VALUES ($1, $2, $3, $4, $5, $6)',
        [email, defaultHash, name, role || 'employee', department, phone]
      );
    } else {
      // Update phone for existing user if linked to this employee
      await client.query('UPDATE users SET phone = $1 WHERE email = $2', [phone, email]);
    }

    await client.query('COMMIT');
    res.status(201).json(empResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/employees/:id - supports partial updates
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get current employee state to handle email changes
    const currentRes = await client.query('SELECT email FROM employees WHERE id = $1', [req.params.id]);
    if (currentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }
    const oldEmail = currentRes.rows[0].email;

    const fieldMap: Record<string, string> = { 
      name: 'name', 
      email: 'email', 
      position: 'position', 
      department: 'department', 
      salary: 'salary', 
      phone: 'phone',
      joinDate: 'join_date', 
      status: 'status',
      managerId: 'manager_id',
      jobTitle: 'job_title'
    };
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, col] of Object.entries(fieldMap)) {
      if (req.body[key] !== undefined) { 
        fields.push(`${col}=$${idx++}`); 
        values.push(req.body[key]); 
      }
    }
    
    if (fields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Nothing to update' });
    }

    fields.push('updated_at=NOW()');
    values.push(req.params.id);
    const result = await client.query(`UPDATE employees SET ${fields.join(', ')} WHERE id=$${idx} RETURNING *`, values);
    const updatedEmployee = result.rows[0];

    // 2. Synchronize with Users table
    // Mapping: name -> display_name, phone -> phone, email -> email
    const userUpdates: string[] = [];
    const userValues: any[] = [];
    let uIdx = 1;

    if (req.body.name !== undefined) { userUpdates.push(`display_name=$${uIdx++}`); userValues.push(req.body.name); }
    if (req.body.phone !== undefined) { userUpdates.push(`phone=$${uIdx++}`); userValues.push(req.body.phone); }
    if (req.body.email !== undefined) { userUpdates.push(`email=$${uIdx++}`); userValues.push(req.body.email); }
    if (req.body.department !== undefined) { userUpdates.push(`department=$${uIdx++}`); userValues.push(req.body.department); }

    if (userUpdates.length > 0) {
      userValues.push(oldEmail);
      await client.query(`UPDATE users SET ${userUpdates.join(', ')} WHERE email=$${uIdx}`, userValues);
    }

    await client.query('COMMIT');
    res.json(updatedEmployee);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/employees/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
