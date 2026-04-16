import pool from './db';

async function migrateHR() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Exit management table
    await client.query(`
      CREATE TABLE IF NOT EXISTS exit_management (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        employee_name VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        position VARCHAR(255),
        exit_type VARCHAR(50) NOT NULL DEFAULT 'resignation',
        exit_date DATE,
        last_working_day DATE,
        notice_period INTEGER DEFAULT 30,
        reason TEXT,
        exit_interview_done BOOLEAN DEFAULT FALSE,
        exit_interview_notes TEXT,
        assets_returned BOOLEAN DEFAULT FALSE,
        final_settlement_amount NUMERIC(12,2) DEFAULT 0,
        final_settlement_paid BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'initiated',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
    `);

    // Add manager_id and reports_to to employees if not exists
    await client.query(`
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES employees(id);
    `);
    await client.query(`
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);
    `);

    await client.query('COMMIT');
    console.log('✅ HR migration complete (exit_management + organogram fields)');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrateHR();
