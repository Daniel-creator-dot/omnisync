import pool from './db';
import bcrypt from 'bcryptjs';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed Users
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const userHash = await bcrypt.hash('User123!', 10);

    const existingAdmin = await client.query(`SELECT id FROM users WHERE email = 'admin@omnisync.com'`);
    if (existingAdmin.rows.length === 0) {
      await client.query(`
        INSERT INTO users (email, password_hash, display_name, role, department) VALUES
        ('admin@omnisync.com', $1, 'Admin User', 'admin', 'Management'),
        ('accountant@omnisync.com', $2, 'Sarah Finance', 'accountant', 'Finance'),
        ('hr@omnisync.com', $2, 'Mike HR', 'hr', 'HR'),
        ('employee@omnisync.com', $2, 'Jane Employee', 'employee', 'Engineering')
      `, [adminHash, userHash]);
      console.log('✅ Users seeded');
    }

    // Seed Employees
    const existingEmp = await client.query(`SELECT id FROM employees LIMIT 1`);
    if (existingEmp.rows.length === 0) {
      await client.query(`
        INSERT INTO employees (name, email, position, department, salary, join_date, status) VALUES
        ('Alice Johnson', 'alice@example.com', 'Senior Engineer', 'Engineering', 120000, '2023-01-15', 'active'),
        ('Bob Smith', 'bob@example.com', 'Sales Manager', 'Sales', 95000, '2023-03-10', 'active'),
        ('Charlie Brown', 'charlie@example.com', 'HR Specialist', 'HR', 75000, '2023-06-20', 'active'),
        ('Diana Prince', 'diana@example.com', 'Product Designer', 'Engineering', 110000, '2023-08-05', 'active'),
        ('Edward Norton', 'edward@example.com', 'Financial Analyst', 'Finance', 85000, '2023-11-12', 'active')
      `);
      console.log('✅ Employees seeded');
    }

    // Seed Invoices
    const existingInv = await client.query(`SELECT id FROM invoices LIMIT 1`);
    if (existingInv.rows.length === 0) {
      await client.query(`
        INSERT INTO invoices (invoice_number, client_name, amount, status, due_date, items) VALUES
        ('INV-001', 'Acme Corp', 5000, 'paid', '2024-05-01', '[]'),
        ('INV-002', 'Globex', 3500, 'pending', '2024-05-15', '[]'),
        ('INV-003', 'Stark Industries', 12000, 'paid', '2024-04-20', '[]'),
        ('INV-004', 'Wayne Ent', 8500, 'pending', '2024-06-10', '[]')
      `);
      console.log('✅ Invoices seeded');
    }

    // Seed Expenses
    const existingExp = await client.query(`SELECT id FROM expenses LIMIT 1`);
    if (existingExp.rows.length === 0) {
      await client.query(`
        INSERT INTO expenses (category, amount, status, date, description) VALUES
        ('Office Supplies', 450, 'approved', '2024-04-10', 'Monthly stationery'),
        ('Travel', 1200, 'approved', '2024-04-15', 'Client meeting in NY'),
        ('Software', 800, 'pending', '2024-04-20', 'Cloud subscription')
      `);
      console.log('✅ Expenses seeded');
    }

    // Seed Assets
    const existingAsset = await client.query(`SELECT id FROM assets LIMIT 1`);
    if (existingAsset.rows.length === 0) {
      await client.query(`
        INSERT INTO assets (name, category, value, purchase_date) VALUES
        ('MacBook Pro 16"', 'Hardware', 2500, '2023-12-01'),
        ('Dell Monitor 32"', 'Hardware', 600, '2024-01-15'),
        ('Office Desk', 'Furniture', 400, '2023-11-20')
      `);
      console.log('✅ Assets seeded');
    }

    // Seed Job Postings
    const existingJob = await client.query(`SELECT id FROM job_postings LIMIT 1`);
    if (existingJob.rows.length === 0) {
      await client.query(`
        INSERT INTO job_postings (title, department, status, description) VALUES
        ('Full Stack Developer', 'Engineering', 'open', 'React & Node.js expert needed.'),
        ('Marketing Lead', 'Marketing', 'open', 'Drive our growth strategy.')
      `);
      console.log('✅ Job Postings seeded');
    }

    // Seed Accounts (Chart of Accounts)
    const existingAcc = await client.query(`SELECT id FROM accounts LIMIT 1`);
    if (existingAcc.rows.length === 0) {
      await client.query(`
        INSERT INTO accounts (code, name, type, balance) VALUES
        ('1000', 'Cash', 'asset', 50000),
        ('1100', 'Accounts Receivable', 'asset', 25000),
        ('1200', 'Inventory', 'asset', 15000),
        ('2000', 'Accounts Payable', 'liability', 10000),
        ('2100', 'Loans Payable', 'liability', 30000),
        ('3000', 'Owner Equity', 'equity', 100000),
        ('4000', 'Sales Revenue', 'revenue', 75000),
        ('4100', 'Service Revenue', 'revenue', 25000),
        ('5000', 'Cost of Goods Sold', 'expense', 20000),
        ('5100', 'Salaries Expense', 'expense', 35000),
        ('5200', 'Rent Expense', 'expense', 12000),
        ('5300', 'Utilities Expense', 'expense', 3000)
      `);
      console.log('✅ Chart of Accounts seeded');
    }

    // Seed Tax Rates
    const existingTax = await client.query(`SELECT id FROM tax_rates LIMIT 1`);
    if (existingTax.rows.length === 0) {
      await client.query(`
        INSERT INTO tax_rates (name, rate) VALUES
        ('Standard VAT', 15),
        ('Reduced Rate', 5),
        ('Zero Rate', 0)
      `);
      console.log('✅ Tax Rates seeded');
    }

    // Seed Departments
    const existingDept = await client.query(`SELECT id FROM departments LIMIT 1`);
    if (existingDept.rows.length === 0) {
      await client.query(`
        INSERT INTO departments (name) VALUES
        ('Engineering'),
        ('Sales'),
        ('HR'),
        ('Finance'),
        ('Operations'),
        ('Marketing')
      `);
      console.log('✅ Departments seeded');
    }

    // Seed Benefits
    const existingBen = await client.query(`SELECT id FROM benefits LIMIT 1`);
    if (existingBen.rows.length === 0) {
      await client.query(`
        INSERT INTO benefits (name, description, cost) VALUES
        ('Health Insurance', 'Comprehensive health coverage for employees and dependents', 500),
        ('Dental Plan', 'Dental coverage including preventive and major dental care', 75),
        ('401(k) Match', 'Company matches up to 6% of employee contribution', 0)
      `);
      console.log('✅ Benefits seeded');
    }

    // Seed Training Courses
    const existingTrain = await client.query(`SELECT id FROM training_courses LIMIT 1`);
    if (existingTrain.rows.length === 0) {
      await client.query(`
        INSERT INTO training_courses (title, provider, duration) VALUES
        ('React Advanced Patterns', 'Udemy', '20 hours'),
        ('Leadership Essentials', 'Coursera', '15 hours'),
        ('Financial Modeling', 'LinkedIn Learning', '10 hours')
      `);
      console.log('✅ Training Courses seeded');
    }

    await client.query('COMMIT');
    console.log('\n🎉 All seed data inserted successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('  Admin:      admin@omnisync.com / Admin123!');
    console.log('  Accountant: accountant@omnisync.com / User123!');
    console.log('  HR:         hr@omnisync.com / User123!');
    console.log('  Employee:   employee@omnisync.com / User123!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
