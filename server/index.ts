import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { auditMiddleware } from './middleware/audit';

dotenv.config();

import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import payrollRoutes from './routes/payroll';
import leaveRoutes from './routes/leave';
import recruitmentRoutes from './routes/recruitment';
import performanceRoutes from './routes/performance';
import trainingRoutes from './routes/training';
import attendanceRoutes from './routes/attendance';
import benefitsRoutes from './routes/benefits';
import onboardingRoutes from './routes/onboarding';
import invoiceRoutes from './routes/invoices';
import expenseRoutes from './routes/expenses';
import accountRoutes from './routes/accounts';
import bankingRoutes from './routes/banking';
import contactRoutes from './routes/contacts';
import inventoryRoutes from './routes/inventory';
import taxRoutes from './routes/taxes';
import assetRoutes from './routes/assets';
import budgetRoutes from './routes/budgets';
import settingsRoutes from './routes/settings';
import dashboardRoutes from './routes/dashboard';
import exitManagementRoutes from './routes/exit-management';
import smsSettingsRoutes from './routes/sms-settings';
import insuranceRoutes from './routes/insurance';
import taskRoutes from './routes/tasks';
import pool from './db';
import { ensureBooks } from './schema';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(auditMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/leave-requests', leaveRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/performance-reviews', performanceRoutes);
app.use('/api/training-courses', trainingRoutes);
app.use('/api/timesheets', attendanceRoutes);
app.use('/api/benefits', benefitsRoutes);
app.use('/api/onboarding-tasks', onboardingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/tax-rates', taxRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/settings/sms', smsSettingsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/exit-management', exitManagementRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await ensureBooks();
    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM chart_of_accounts) AS accounts,
        (SELECT COUNT(*)::int FROM journal_entries) AS journals,
        (SELECT COUNT(*)::int FROM payments) AS payments,
        (SELECT COUNT(*)::int FROM payroll) AS payroll
    `);
    res.json({ status: 'ok', revision: 'desk-7', books: counts.rows[0], timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ status: 'error', revision: 'desk-7', error: error.message });
  }
});

async function start() {
  try {
    await ensureBooks();
  } catch (error) {
    console.error('books setup failed', error);
  }
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

start();
