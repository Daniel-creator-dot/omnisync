import pool from './db';
import bcrypt from 'bcryptjs';

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🚀 Initializing database schema...');

    // 1. Core Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'employee',
        department VARCHAR(100),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        position VARCHAR(255),
        job_title VARCHAR(255),
        department VARCHAR(100),
        salary NUMERIC(12,2) DEFAULT 0,
        join_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        manager_id INTEGER REFERENCES employees(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
    `);

    // 2. Accounting Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) DEFAULT 'OmniSync Insurance',
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip VARCHAR(20),
        phone VARCHAR(50),
        email VARCHAR(255),
        website VARCHAR(255),
        tax_id VARCHAR(50),
        logo_url TEXT,
        invoice_prefix VARCHAR(20) DEFAULT 'INV-',
        invoice_next_number INTEGER DEFAULT 1001,
        currency VARCHAR(10) DEFAULT 'USD',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`INSERT INTO company_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100),
        customer_id INTEGER,
        client_name VARCHAR(255),
        amount NUMERIC(12,2) DEFAULT 0,
        subtotal NUMERIC(12,2) DEFAULT 0,
        tax_rate NUMERIC(6,3) DEFAULT 0,
        tax_amount NUMERIC(12,2) DEFAULT 0,
        discount NUMERIC(12,2) DEFAULT 0,
        amount_paid NUMERIC(12,2) DEFAULT 0,
        balance_due NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE,
        issue_date DATE DEFAULT CURRENT_DATE,
        items JSONB DEFAULT '[]',
        notes TEXT,
        terms TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100),
        amount NUMERIC(12,2) DEFAULT 0,
        date DATE,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        submitted_by INTEGER,
        vendor_id INTEGER,
        account_id INTEGER,
        receipt_url TEXT,
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        balance NUMERIC(14,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        method VARCHAR(50) DEFAULT 'check',
        reference VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. HR & SMS Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS sms_config (
        id SERIAL PRIMARY KEY,
        base_url TEXT NOT NULL,
        sender_id VARCHAR(50) NOT NULL,
        api_key TEXT,
        api_secret TEXT,
        provider VARCHAR(50),
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`
      INSERT INTO sms_config (id, base_url, sender_id, provider) 
      VALUES (1, 'https://api.sms-provider.com/send', 'OmniSync', 'Default') 
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS exit_management (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        employee_name VARCHAR(255) NOT NULL,
        exit_type VARCHAR(50) NOT NULL DEFAULT 'resignation',
        exit_date DATE,
        status VARCHAR(50) DEFAULT 'initiated',
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Audit & Security
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255),
        action VARCHAR(50) NOT NULL,
        resource VARCHAR(255) NOT NULL,
        details JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Default Admin User
    const adminCheck = await client.query('SELECT id FROM users WHERE email = $1', ['admin@omnisync.com']);
    if (adminCheck.rows.length === 0) {
      console.log('Seeding default admin user...');
      const hash = await bcrypt.hash('zxcv123$$', 10);
      await client.query(
        'INSERT INTO users (email, password_hash, display_name, role, department) VALUES ($1, $2, $3, $4, $5)',
        ['admin@omnisync.com', hash, 'Admin User', 'admin', 'Management']
      );
    }

    // 6. Ensure recent schema patches are applied (idempotent ALTERs)
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
    await client.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
    await client.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES employees(id)');
    await client.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_title VARCHAR(255)');

    await client.query('COMMIT');
    console.log('✅ Database initialized successfully');
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', error);
    // Don't swallow the error, we want the server to fail if DB is broken
    throw error;
  } finally {
    client.release();
  }
}
