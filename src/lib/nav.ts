import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, FileText, Users, Banknote, CalendarDays,
  BookOpen, Receipt, Coins, Package, Percent, Briefcase, Star,
  GraduationCap, Clock, Heart, Landmark, PieChart, FileBarChart, ListTodo,
  UserCircle, Settings, ArrowRightLeft, Network, DoorOpen, CheckSquare,
} from 'lucide-react';

export type NavLink = {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
  hint: string;
};

export type NavSection = {
  section: string;
  roles: string[];
};

export type NavItem = NavLink | NavSection;

export function isSection(item: NavItem): item is NavSection {
  return 'section' in item;
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'accountant', 'hr', 'employee'], hint: 'Overview' },
  { id: 'desk-tasks', label: 'Desk tasks', icon: CheckSquare, roles: ['admin', 'accountant', 'hr', 'employee'], hint: 'Follow-ups' },

  { section: 'Accounting', roles: ['admin', 'accountant'] },
  { id: 'acc-transactions', label: 'Transactions', icon: ArrowRightLeft, roles: ['admin', 'accountant'], hint: 'Accounting' },
  { id: 'acc-sales', label: 'Invoices / Sales', icon: Coins, roles: ['admin', 'accountant'], hint: 'Accounting' },
  { id: 'acc-purchases', label: 'Bills / Purchases', icon: Receipt, roles: ['admin', 'accountant'], hint: 'Accounting' },
  { id: 'acc-banking', label: 'Banking', icon: Landmark, roles: ['admin', 'accountant'], hint: 'Accounting' },
  { id: 'acc-accounts', label: 'General Ledger', icon: BookOpen, roles: ['admin', 'accountant'], hint: 'Accounting' },
  { id: 'acc-expenses', label: 'Expenses', icon: Receipt, roles: ['admin', 'accountant'], hint: 'Accounting' },
  { id: 'acc-assets', label: 'Fixed Assets', icon: Landmark, roles: ['admin', 'accountant'], hint: 'Accounting' },
  { id: 'acc-budgets', label: 'Budgets', icon: PieChart, roles: ['admin', 'accountant'], hint: 'Accounting' },
  { id: 'acc-contacts', label: 'Contacts', icon: Users, roles: ['admin', 'accountant'], hint: 'Accounting' },
  { id: 'acc-inventory', label: 'Inventory', icon: Package, roles: ['admin', 'accountant'], hint: 'Accounting' },
  { id: 'acc-reports', label: 'Financial Reports', icon: FileBarChart, roles: ['admin', 'accountant'], hint: 'Accounting' },
  { id: 'acc-taxes', label: 'Tax Management', icon: Percent, roles: ['admin', 'accountant'], hint: 'Accounting' },
  { id: 'acc-settings', label: 'Accounting Settings', icon: Settings, roles: ['admin', 'accountant'], hint: 'Accounting' },

  { section: 'Human Resources', roles: ['admin', 'hr', 'employee'] },
  { id: 'employees', label: 'Employees', icon: Users, roles: ['admin', 'hr'], hint: 'People' },
  { id: 'payroll', label: 'Payroll', icon: Banknote, roles: ['admin', 'accountant', 'hr'], hint: 'People' },
  { id: 'leave', label: 'Leave Requests', icon: CalendarDays, roles: ['admin', 'hr', 'employee'], hint: 'People' },
  { id: 'recruitment', label: 'Recruitment', icon: Briefcase, roles: ['admin', 'hr'], hint: 'People' },
  { id: 'performance', label: 'Performance', icon: Star, roles: ['admin', 'hr'], hint: 'People' },
  { id: 'training', label: 'Training', icon: GraduationCap, roles: ['admin', 'hr'], hint: 'People' },
  { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['admin', 'hr', 'employee'], hint: 'People' },
  { id: 'benefits', label: 'Benefits', icon: Heart, roles: ['admin', 'hr'], hint: 'People' },
  { id: 'onboarding', label: 'Onboarding', icon: ListTodo, roles: ['admin', 'hr'], hint: 'People' },
  { id: 'ess', label: 'Self Service', icon: UserCircle, roles: ['admin', 'hr', 'employee'], hint: 'People' },
  { id: 'organogram', label: 'Organogram', icon: Network, roles: ['admin', 'hr', 'employee'], hint: 'People' },
  { id: 'exit-management', label: 'Exit Management', icon: DoorOpen, roles: ['admin', 'hr'], hint: 'People' },
  { id: 'hr-reports', label: 'HR Reports', icon: FileBarChart, roles: ['admin', 'hr'], hint: 'People' },
  { id: 'hr-settings', label: 'HR Settings', icon: Settings, roles: ['admin', 'hr'], hint: 'People' },

  { section: 'Insurance', roles: ['admin', 'accountant', 'hr', 'employee'] },
  { id: 'ins-clients', label: 'Clients', icon: Users, roles: ['admin', 'accountant', 'hr', 'employee'], hint: 'Insurance' },
  { id: 'ins-policies', label: 'Policies', icon: FileText, roles: ['admin', 'accountant', 'hr', 'employee'], hint: 'Insurance' },
  { id: 'ins-leads', label: 'Leads', icon: Briefcase, roles: ['admin', 'accountant', 'hr', 'employee'], hint: 'Insurance' },
  { id: 'ins-products', label: 'Products', icon: Package, roles: ['admin', 'accountant'], hint: 'Insurance' },
  { id: 'ins-commissions', label: 'Commissions', icon: Coins, roles: ['admin', 'accountant'], hint: 'Insurance' },
  { id: 'ins-cashbook', label: 'Cashbook', icon: ArrowRightLeft, roles: ['admin', 'accountant'], hint: 'Insurance' },
];

export function deskRole(role?: string | null) {
  if (!role) return '';
  return role === 'SUPER_ADMIN' ? 'admin' : role;
}

export function visibleNav(role?: string | null) {
  const normalized = deskRole(role);
  return navItems.filter((item) => item.roles.includes(normalized));
}

export function navLinks(role?: string | null) {
  return visibleNav(role).filter((item): item is NavLink => !isSection(item));
}
