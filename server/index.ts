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

import { initializeDatabase } from './initialize';

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 OmniSync API server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  }
}

start();
