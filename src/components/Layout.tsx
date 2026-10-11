import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, FileText, Users, Banknote, CalendarDays, LogOut,
  Menu, X, BookOpen, Receipt, Coins, Package, Percent, Briefcase, Star,
  GraduationCap, Clock, Heart, Landmark, PieChart, FileBarChart, ListTodo,
  UserCircle, Settings, ArrowRightLeft, Network, DoorOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

type MenuItem = { id: string; label: string; icon: any; roles: string[]; section?: undefined }
  | { section: string; roles: string[]; id?: undefined; label?: undefined; icon?: undefined };

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { profile, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => { setIsMobileMenuOpen(false); }, [activeTab]);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'accountant', 'hr', 'employee'] },
    
    { section: 'Accounting', roles: ['admin', 'accountant'] },
    { id: 'acc-transactions', label: 'Transactions', icon: ArrowRightLeft, roles: ['admin', 'accountant'] },
    { id: 'acc-sales', label: 'Invoices / Sales', icon: Coins, roles: ['admin', 'accountant'] },
    { id: 'acc-purchases', label: 'Bills / Purchases', icon: Receipt, roles: ['admin', 'accountant'] },
    { id: 'acc-banking', label: 'Banking', icon: Landmark, roles: ['admin', 'accountant'] },
    { id: 'acc-accounts', label: 'General Ledger', icon: BookOpen, roles: ['admin', 'accountant'] },
    { id: 'acc-expenses', label: 'Expenses', icon: Receipt, roles: ['admin', 'accountant'] },
    { id: 'acc-assets', label: 'Fixed Assets', icon: Landmark, roles: ['admin', 'accountant'] },
    { id: 'acc-budgets', label: 'Budgets', icon: PieChart, roles: ['admin', 'accountant'] },
    { id: 'acc-contacts', label: 'Contacts', icon: Users, roles: ['admin', 'accountant'] },
    { id: 'acc-inventory', label: 'Inventory', icon: Package, roles: ['admin', 'accountant'] },
    { id: 'acc-reports', label: 'Financial Reports', icon: FileBarChart, roles: ['admin', 'accountant'] },
    { id: 'acc-taxes', label: 'Tax Management', icon: Percent, roles: ['admin', 'accountant'] },
    { id: 'acc-settings', label: 'Accounting Settings', icon: Settings, roles: ['admin', 'accountant'] },
    
    { section: 'Human Resources', roles: ['admin', 'hr', 'employee'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['admin', 'hr'] },
    { id: 'payroll', label: 'Payroll', icon: Banknote, roles: ['admin', 'accountant', 'hr'] },
    { id: 'leave', label: 'Leave Requests', icon: CalendarDays, roles: ['admin', 'hr', 'employee'] },
    { id: 'recruitment', label: 'Recruitment', icon: Briefcase, roles: ['admin', 'hr'] },
    { id: 'performance', label: 'Performance', icon: Star, roles: ['admin', 'hr'] },
    { id: 'training', label: 'Training', icon: GraduationCap, roles: ['admin', 'hr'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['admin', 'hr', 'employee'] },
    { id: 'benefits', label: 'Benefits', icon: Heart, roles: ['admin', 'hr'] },
    { id: 'onboarding', label: 'Onboarding', icon: ListTodo, roles: ['admin', 'hr'] },
    { id: 'ess', label: 'Self Service', icon: UserCircle, roles: ['admin', 'hr', 'employee'] },
    { id: 'organogram', label: 'Organogram', icon: Network, roles: ['admin', 'hr', 'employee'] },
    { id: 'exit-management', label: 'Exit Management', icon: DoorOpen, roles: ['admin', 'hr'] },
    { id: 'hr-reports', label: 'HR Reports', icon: FileBarChart, roles: ['admin', 'hr'] },
    { id: 'hr-settings', label: 'HR Settings', icon: Settings, roles: ['admin', 'hr'] },

    { section: 'Insurance', roles: ['admin', 'accountant', 'hr', 'employee'] },
    { id: 'ins-clients', label: 'Clients', icon: Users, roles: ['admin', 'accountant', 'hr', 'employee'] },
    { id: 'ins-policies', label: 'Policies', icon: FileText, roles: ['admin', 'accountant', 'hr', 'employee'] },
    { id: 'ins-leads', label: 'Leads', icon: Briefcase, roles: ['admin', 'accountant', 'hr', 'employee'] },
    { id: 'ins-products', label: 'Products', icon: Package, roles: ['admin', 'accountant'] },
    { id: 'ins-commissions', label: 'Commissions', icon: Coins, roles: ['admin', 'accountant'] },
    { id: 'ins-cashbook', label: 'Cashbook', icon: ArrowRightLeft, roles: ['admin', 'accountant'] },
  ];

  const filteredItems = menuItems.filter(item => profile && item.roles.includes(profile.role));
  const activeLabel = filteredItems.find(item => item.id === activeTab)?.label || 'Dashboard';

  const navClass = (active: boolean, compact = false) =>
    `flex w-full items-center justify-start gap-2.5 rounded-lg px-2.5 font-medium transition-colors ${compact ? 'h-10 text-sm' : 'h-8 text-[13px]'} ${
      active
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const renderNavItem = (item: MenuItem, index: number) => {
    if (item.section) {
      return (
        <div key={`section-${item.section}`} className={`px-2 pb-1 ${index > 0 ? 'mt-3 pt-3 border-t border-slate-100' : 'pt-2'}`}>
          {isSidebarOpen && <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{item.section}</p>}
          {!isSidebarOpen && <div className="border-t border-slate-200" />}
        </div>
      );
    }
    const active = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        className={navClass(active)}
        onClick={() => setActiveTab(item.id!)}
      >
        <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
        {isSidebarOpen && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  const renderMobileNavItem = (item: MenuItem, index: number) => {
    if (item.section) {
      return (
        <div key={`section-${item.section}`} className={`px-2 pb-1 ${index > 0 ? 'mt-3 pt-3 border-t border-slate-100' : 'pt-1'}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{item.section}</p>
        </div>
      );
    }
    const active = activeTab === item.id;
    return (
      <button
        key={item.id}
        type="button"
        className={navClass(active, true)}
        onClick={() => setActiveTab(item.id!)}
      >
        <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
        <span>{item.label}</span>
      </button>
    );
  };

  const avatar = (
    <Avatar className="h-8 w-8 ring-1 ring-slate-200">
      <AvatarImage src={profile?.displayName ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.displayName}` : undefined} />
      <AvatarFallback className="bg-indigo-50 text-xs font-medium text-indigo-700">{profile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
    </Avatar>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef1f7] text-slate-900">
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white">
            <Landmark className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold tracking-tight">Bytz360</span>
        </div>
        <Button variant="ghost" size="icon" aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 248 : 76 }}
        className="hidden lg:flex shrink-0 flex-col border-r border-slate-200/80 bg-white"
      >
        <div className="flex h-14 items-center justify-between px-3">
          {isSidebarOpen && (
            <div className="flex items-center gap-2 pl-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white">
                <Landmark className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold tracking-tight">Bytz360</span>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {filteredItems.map((item, i) => renderNavItem(item, i))}
        </nav>

        <div className="border-t border-slate-100 p-2">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            {avatar}
            {isSidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{profile?.displayName}</p>
                <p className="truncate text-xs capitalize text-slate-500">{profile?.role}</p>
              </div>
            )}
          </div>
          <Button variant="ghost" className="h-8 w-full justify-start gap-2.5 text-[13px] text-slate-500 hover:bg-rose-50 hover:text-rose-600" onClick={logout}>
            <LogOut className="h-4 w-4 shrink-0" />
            {isSidebarOpen && <span>Log out</span>}
          </Button>
        </div>
      </motion.aside>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <motion.aside
        initial={{ x: -320 }}
        animate={{ x: isMobileMenuOpen ? 0 : -320 }}
        transition={{ type: 'tween', duration: 0.2 }}
        className="lg:hidden fixed top-0 bottom-0 left-0 z-50 flex w-[280px] flex-col bg-white shadow-xl"
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
          <span className="font-semibold tracking-tight">Bytz360</span>
          <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {filteredItems.map((item, i) => renderMobileNavItem(item, i))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 flex items-center gap-3">
            {avatar}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profile?.displayName}</p>
              <p className="truncate text-xs capitalize text-slate-500">{profile?.role}</p>
            </div>
          </div>
          <Button variant="outline" className="h-9 w-full justify-center gap-2 text-rose-600" onClick={logout}>
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden lg:flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Bytz360</p>
            <p className="text-sm font-medium text-slate-900">{activeLabel}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">{profile?.role}</span>
            <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
        <main className="custom-scrollbar flex-1 overflow-y-auto px-4 pb-8 pt-[4.5rem] md:px-6 lg:px-8 lg:pt-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
