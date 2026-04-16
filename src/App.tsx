import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Layout from './components/Layout';

import Dashboard from './modules/Dashboard';
import LoginPage from './modules/Auth/LoginPage';
import Transactions from './modules/Accounting/Transactions';
import Sales from './modules/Accounting/Sales';
import Purchases from './modules/Accounting/Purchases';
import Banking from './modules/Accounting/Banking';
import Accounts from './modules/Accounting/Accounts';
import Contacts from './modules/Accounting/Contacts';
import Inventory from './modules/Accounting/Inventory';
import AccountingSettings from './modules/Accounting/AccountingSettings';
import TaxManagement from './modules/Accounting/TaxManagement';
import FinancialReports from './modules/Accounting/FinancialReports';
import HRReports from './modules/HR/HRReports';
import HRSettings from './modules/HR/HRSettings';

import Employees from './modules/HR/Employees';
import Payroll from './modules/HR/Payroll';
import Leave from './modules/HR/LeaveRequests';
import Recruitment from './modules/HR/Recruitment';
import Performance from './modules/HR/Performance';
import Training from './modules/HR/Training';
import Attendance from './modules/HR/Attendance';
import Benefits from './modules/HR/Benefits';
import Onboarding from './modules/HR/Onboarding';
import Organogram from './modules/HR/Organogram';
import ExitManagement from './modules/HR/ExitManagement';
import SelfService from './modules/HR/SelfService';

function AppContent() {
  const { user, loading, login } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'acc-transactions': return <Transactions />;
      case 'acc-sales': return <Sales />;
      case 'acc-purchases': return <Purchases />;
      case 'acc-banking': return <Banking />;
      case 'acc-accounts': return <Accounts />;
      case 'acc-contacts': return <Contacts />;
      case 'acc-inventory': return <Inventory />;
      case 'acc-reports': return <FinancialReports />;
      case 'acc-taxes': return <TaxManagement />;
      case 'acc-settings': return <AccountingSettings />;
      case 'employees': return <Employees />;
      case 'payroll': return <Payroll />;
      case 'leave': return <Leave />;
      case 'recruitment': return <Recruitment />;
      case 'performance': return <Performance />;
      case 'training': return <Training />;
      case 'attendance': return <Attendance />;
      case 'benefits': return <Benefits />;
      case 'onboarding': return <Onboarding />;
      case 'organogram': return <Organogram />;
      case 'exit-management': return <ExitManagement />;
      case 'ess': return <SelfService />;
      case 'hr-reports': return <HRReports />;
      case 'hr-settings': return <HRSettings />;
      default: return <Dashboard />;
    }
  };

  return (
    <SettingsProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </SettingsProvider>
  );
}

import { Toaster } from './components/ui/sonner';

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </ErrorBoundary>
  );
}
