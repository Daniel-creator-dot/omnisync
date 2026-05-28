export type UserRole = 'admin' | 'accountant' | 'hr' | 'employee';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  department?: string;
  createdAt: string;
}

// Accounting Types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  clientName: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'void';
  dueDate: string;
  items: InvoiceItem[];
  createdAt: string;
}

export interface CreditNote {
  id: string;
  number: string;
  customerId: string;
  amount: number;
  date: string;
  reason: string;
}

export interface Payment {
  id: string;
  type: 'inbound' | 'outbound';
  amount: number;
  date: string;
  method: string;
  referenceId?: string;
  contactId?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  amount: number;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  date: string;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  balance: number;
}

export interface BankTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  description: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  stockLevel: number;
  category: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  quantity: number;
  type: 'addition' | 'reduction';
  reason: string;
  date: string;
}

export interface FiscalYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed';
}

export interface Department {
  id: string;
  name: string;
  headId?: string;
}

export interface Policy {
  id: string;
  title: string;
  content: string;
  category: string;
  lastUpdated: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'approved' | 'pending' | 'rejected';
  submittedBy: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  lines: JournalLine[];
}

export interface JournalLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Bill {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
}

export interface Asset {
  id: string;
  name: string;
  purchaseDate: string;
  value: number;
  depreciationRate: number;
}

// HR Types
export interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  joinDate: string;
  status: 'active' | 'inactive';
  deduction_type?: 'none' | 'percentage' | 'raw';
  deduction_value?: number;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'paid' | 'pending';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'sick' | 'vacation' | 'personal';
  startDate: string;
  endDate: string;
  status: 'approved' | 'pending' | 'rejected';
  reason: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  description: string;
  status: 'open' | 'closed';
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  jobId: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected';
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  date: string;
  rating: number;
  comments: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  provider: string;
  duration: string;
}

export interface Timesheet {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  status: 'submitted' | 'approved' | 'rejected';
}

export interface Benefit {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export interface Budget {
  id: string;
  year: number;
  category: string;
  amount: number;
  actual: number;
}

export interface OnboardingTask {
  id: string;
  employeeId: string;
  task: string;
  completed: boolean;
}
