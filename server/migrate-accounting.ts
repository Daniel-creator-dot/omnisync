import pool from './db';

async function migrateAccounting() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add company_settings for invoice branding
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) DEFAULT 'OmniSync Insurance',
        address TEXT DEFAULT '123 Business Ave, Suite 100',
        city VARCHAR(100) DEFAULT 'New York',
        state VARCHAR(50) DEFAULT 'NY',
        zip VARCHAR(20) DEFAULT '10001',
        phone VARCHAR(50) DEFAULT '(555) 123-4567',
        email VARCHAR(255) DEFAULT 'billing@omnisync.com',
        website VARCHAR(255) DEFAULT 'www.omnisync.com',
        tax_id VARCHAR(50) DEFAULT '12-3456789',
        logo_url TEXT,
        invoice_prefix VARCHAR(20) DEFAULT 'INV-',
        invoice_next_number INTEGER DEFAULT 1001,
        payment_terms INTEGER DEFAULT 30,
        default_notes TEXT DEFAULT 'Thank you for your business!',
        currency VARCHAR(10) DEFAULT 'USD',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Insert default company settings if not exists
    await client.query(`
      INSERT INTO company_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
    `);

    // Add more fields to invoices
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) DEFAULT 0;`);
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(6,3) DEFAULT 0;`);
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0;`);
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0;`);
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) DEFAULT 0;`);
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS balance_due NUMERIC(12,2) DEFAULT 0;`);
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;`);
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms TEXT;`);
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE;`);

    // Add more fields to customers
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS company VARCHAR(255);`);
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;`);
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(100);`);
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS state VARCHAR(50);`);
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip VARCHAR(20);`);
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) DEFAULT 0;`);

    // Payments table for tracking invoice payments
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

    // Add more fields to expenses
    await client.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vendor_id INTEGER;`);
    await client.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;`);
    await client.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);`);
    await client.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS account_id INTEGER;`);

    // Add more fields to bills
    await client.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS bill_number VARCHAR(100);`);
    await client.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';`);
    await client.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) DEFAULT 0;`);
    await client.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS notes TEXT;`);

    await client.query('COMMIT');
    console.log('✅ Accounting schema upgrades applied!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateAccounting();
