import pool from './db';
import bcrypt from 'bcryptjs';

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🚀 Initializing database schema...');

    // =============================================
    // 1. CORE TABLES
    // =============================================
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
        deduction_type VARCHAR(50) DEFAULT 'none',
        deduction_value NUMERIC(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
    `);

    // =============================================
    // 2. ACCOUNTING TABLES
    // =============================================
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
        currency VARCHAR(10) DEFAULT 'GH₵',
        payment_terms TEXT DEFAULT 'Net 30',
        default_notes TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`INSERT INTO company_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;`);

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
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        date DATE DEFAULT CURRENT_DATE,
        description TEXT,
        reference VARCHAR(100),
        lines JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        purchase_date DATE,
        value NUMERIC(12,2) DEFAULT 0,
        depreciation_rate NUMERIC(6,3) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_rates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        rate NUMERIC(6,3) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        year INTEGER,
        category VARCHAR(255),
        amount NUMERIC(12,2) DEFAULT 0,
        actual NUMERIC(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // =============================================
    // 3. BANKING TABLES
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        account_number VARCHAR(100),
        bank_name VARCHAR(255),
        currency VARCHAR(10) DEFAULT 'GH₵',
        balance NUMERIC(14,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_transfers (
        id SERIAL PRIMARY KEY,
        from_account_id INTEGER REFERENCES bank_accounts(id),
        to_account_id INTEGER REFERENCES bank_accounts(id),
        amount NUMERIC(12,2) NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // =============================================
    // 4. CONTACTS TABLES (Vendors, Customers, Bills)
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(50),
        zip VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER REFERENCES vendors(id),
        vendor_name VARCHAR(255),
        amount NUMERIC(12,2) DEFAULT 0,
        amount_paid NUMERIC(12,2) DEFAULT 0,
        due_date DATE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // =============================================
    // 5. INVENTORY TABLES
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(12,2) DEFAULT 0,
        cost NUMERIC(12,2) DEFAULT 0,
        stock_level INTEGER DEFAULT 0,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER DEFAULT 0,
        type VARCHAR(50),
        reason TEXT,
        date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // =============================================
    // 6. HR TABLES
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        employee_name VARCHAR(255),
        type VARCHAR(50),
        start_date DATE,
        end_date DATE,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS timesheets (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        date DATE,
        hours NUMERIC(5,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'submitted',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS benefits (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cost NUMERIC(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS onboarding_tasks (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        task TEXT NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        employee_name VARCHAR(255),
        month INTEGER,
        year INTEGER,
        base_salary NUMERIC(12,2) DEFAULT 0,
        bonuses NUMERIC(12,2) DEFAULT 0,
        deductions NUMERIC(12,2) DEFAULT 0,
        net_salary NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS performance_reviews (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        reviewer_id INTEGER,
        date DATE,
        rating INTEGER,
        comments TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS training_courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        provider VARCHAR(255),
        duration VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // =============================================
    // 7. RECRUITMENT TABLES
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_postings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        description TEXT,
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        job_id INTEGER REFERENCES job_postings(id),
        status VARCHAR(50) DEFAULT 'applied',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // =============================================
    // 8. SETTINGS TABLES
    // =============================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll_settings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'percentage',
        value NUMERIC(12,4) DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS fiscal_years (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // =============================================
    // 9. SMS & PASSWORD RESET
    // =============================================
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
      INSERT INTO sms_config (id, base_url, sender_id, provider, is_active) 
      VALUES (1, 'https://sms.smsnotifygh.com/smsapi', 'BytzForge', 'SMSNotifyGH', true) 
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

    // =============================================
    // 10. EXIT MANAGEMENT (full schema)
    // =============================================
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
        status VARCHAR(50) DEFAULT 'initiated',
        reason TEXT,
        exit_interview_done BOOLEAN DEFAULT false,
        exit_interview_notes TEXT,
        assets_returned BOOLEAN DEFAULT false,
        final_settlement_amount NUMERIC(12,2) DEFAULT 0,
        final_settlement_paid BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
    `);

    // =============================================
    // 11. AUDIT & SECURITY
    // =============================================
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

    // =============================================
    // 12. DEFAULT ADMIN USER
    // =============================================
    const adminCheck = await client.query('SELECT id FROM users WHERE email = $1', ['admin@omnisync.com']);
    if (adminCheck.rows.length === 0) {
      console.log('Seeding default admin user...');
      const hash = await bcrypt.hash('zxcv123$$', 10);
      await client.query(
        'INSERT INTO users (email, password_hash, display_name, role, department) VALUES ($1, $2, $3, $4, $5)',
        ['admin@omnisync.com', hash, 'Admin User', 'admin', 'Management']
      );
    }

    // =============================================
    // 13. IDEMPOTENT SCHEMA PATCHES (for existing DBs)
    // =============================================
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
    await client.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(20)');
    await client.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES employees(id)');
    await client.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_title VARCHAR(255)');
    await client.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS deduction_type VARCHAR(50) DEFAULT \'none\'');
    await client.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS deduction_value NUMERIC(12,2) DEFAULT 0');
    await client.query('ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT \'Net 30\'');
    await client.query('ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS default_notes TEXT');
    // exit_management patches
    await client.query('ALTER TABLE exit_management ADD COLUMN IF NOT EXISTS department VARCHAR(100)');
    await client.query('ALTER TABLE exit_management ADD COLUMN IF NOT EXISTS position VARCHAR(255)');
    await client.query('ALTER TABLE exit_management ADD COLUMN IF NOT EXISTS last_working_day DATE');
    await client.query('ALTER TABLE exit_management ADD COLUMN IF NOT EXISTS notice_period INTEGER DEFAULT 30');
    await client.query('ALTER TABLE exit_management ADD COLUMN IF NOT EXISTS exit_interview_done BOOLEAN DEFAULT false');
    await client.query('ALTER TABLE exit_management ADD COLUMN IF NOT EXISTS exit_interview_notes TEXT');
    await client.query('ALTER TABLE exit_management ADD COLUMN IF NOT EXISTS assets_returned BOOLEAN DEFAULT false');
    await client.query('ALTER TABLE exit_management ADD COLUMN IF NOT EXISTS final_settlement_amount NUMERIC(12,2) DEFAULT 0');
    await client.query('ALTER TABLE exit_management ADD COLUMN IF NOT EXISTS final_settlement_paid BOOLEAN DEFAULT false');
    await client.query('ALTER TABLE exit_management ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP');
    // customers patches
    await client.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS company VARCHAR(255)');
    await client.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT');
    await client.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(100)');
    await client.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS state VARCHAR(50)');
    await client.query('ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip VARCHAR(20)');
    // sms_config patches
    await client.query('ALTER TABLE sms_config ADD COLUMN IF NOT EXISTS api_key TEXT');
    await client.query('ALTER TABLE sms_config ADD COLUMN IF NOT EXISTS api_secret TEXT');
    await client.query('ALTER TABLE sms_config ADD COLUMN IF NOT EXISTS provider VARCHAR(50)');
    await client.query('ALTER TABLE sms_config ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false');
    await client.query("UPDATE sms_config SET base_url = 'https://sms.smsnotifygh.com/smsapi', sender_id = 'BytzForge', provider = 'SMSNotifyGH', is_active = true WHERE id = 1");

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
