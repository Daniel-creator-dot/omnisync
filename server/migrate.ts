import pool from './db';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'employee',
        department VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Employees
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        position VARCHAR(255),
        department VARCHAR(100),
        salary NUMERIC(12,2) DEFAULT 0,
        join_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
    `);

    // Payroll
    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        employee_name VARCHAR(255),
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        base_salary NUMERIC(12,2) DEFAULT 0,
        bonuses NUMERIC(12,2) DEFAULT 0,
        deductions NUMERIC(12,2) DEFAULT 0,
        net_salary NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Leave Requests
    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER,
        employee_name VARCHAR(255),
        type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP
      );
    `);

    // Job Postings
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

    // Candidates
    await client.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        job_id INTEGER REFERENCES job_postings(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'applied',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Performance Reviews
    await client.query(`
      CREATE TABLE IF NOT EXISTS performance_reviews (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        reviewer_id INTEGER,
        date DATE NOT NULL,
        rating INTEGER DEFAULT 0,
        comments TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Training Courses
    await client.query(`
      CREATE TABLE IF NOT EXISTS training_courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        provider VARCHAR(255),
        duration VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Timesheets
    await client.query(`
      CREATE TABLE IF NOT EXISTS timesheets (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        hours NUMERIC(5,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'submitted',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Benefits
    await client.query(`
      CREATE TABLE IF NOT EXISTS benefits (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cost NUMERIC(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Onboarding Tasks
    await client.query(`
      CREATE TABLE IF NOT EXISTS onboarding_tasks (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
        task VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Invoices
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100),
        customer_id INTEGER,
        client_name VARCHAR(255),
        amount NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE,
        items JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Expenses
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100),
        amount NUMERIC(12,2) DEFAULT 0,
        date DATE,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        submitted_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Chart of Accounts
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

    // Journal Entries
    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        description TEXT,
        reference VARCHAR(100),
        lines JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Bank Accounts
    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        account_number VARCHAR(100),
        bank_name VARCHAR(255),
        currency VARCHAR(10) DEFAULT 'USD',
        balance NUMERIC(14,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Bank Transfers
    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_transfers (
        id SERIAL PRIMARY KEY,
        from_account_id INTEGER REFERENCES bank_accounts(id) ON DELETE SET NULL,
        to_account_id INTEGER REFERENCES bank_accounts(id) ON DELETE SET NULL,
        amount NUMERIC(12,2) DEFAULT 0,
        date DATE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Vendors
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

    // Customers
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Products
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

    // Stock Adjustments
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 0,
        type VARCHAR(50),
        reason TEXT,
        date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tax Rates
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_rates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        rate NUMERIC(6,3) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Assets
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

    // Budgets
    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        category VARCHAR(100),
        amount NUMERIC(12,2) DEFAULT 0,
        actual NUMERIC(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Departments
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        head_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Policies
    await client.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        category VARCHAR(100),
        last_updated TIMESTAMP DEFAULT NOW()
      );
    `);

    // Payroll Settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll_settings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        value NUMERIC(12,4) DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Fiscal Years
    await client.query(`
      CREATE TABLE IF NOT EXISTS fiscal_years (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Bills
    await client.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
        vendor_name VARCHAR(255),
        amount NUMERIC(12,2) DEFAULT 0,
        due_date DATE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Purchase Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(100),
        vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
        amount NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('✅ All tables created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
