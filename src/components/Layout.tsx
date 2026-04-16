import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, FileText, CreditCard, Users, Banknote, CalendarDays, LogOut,
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
    
    // Accounting
    { section: 'Accounting', roles: ['admin', 'accountant'] },
    { id: 'acc-transactions', label: 'Transactions', icon: ArrowRightLeft, roles: ['admin', 'accountant'] },
    { id: 'acc-sales', label: 'Invoices / Sales', icon: Coins, roles: ['admin', 'accountant'] },
    { id: 'acc-purchases', label: 'Bills / Purchases', icon: Receipt, roles: ['admin', 'accountant'] },
    { id: 'acc-banking', label: 'Banking', icon: Landmark, roles: ['admin', 'accountant'] },
    { id: 'acc-accounts', label: 'Chart of Accounts', icon: BookOpen, roles: ['admin', 'accountant'] },
    { id: 'acc-contacts', label: 'Contacts', icon: Users, roles: ['admin', 'accountant'] },
    { id: 'acc-inventory', label: 'Inventory', icon: Package, roles: ['admin', 'accountant'] },
    { id: 'acc-reports', label: 'Financial Reports', icon: FileBarChart, roles: ['admin', 'accountant'] },
    { id: 'acc-taxes', label: 'Tax Management', icon: Percent, roles: ['admin', 'accountant'] },
    { id: 'acc-settings', label: 'Accounting Settings', icon: Settings, roles: ['admin', 'accountant'] },
    
    // HR
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
  ];

  const filteredItems = menuItems.filter(item => profile && item.roles.includes(profile.role));

  const renderNavItem = (item: MenuItem, index: number) => {
    if (item.section) {
      return (
        <div key={`section-${item.section}`} className={`pt-4 pb-1 px-2 ${index > 0 ? 'mt-2 border-t border-slate-100' : ''}`}>
          {isSidebarOpen && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.section}</p>}
          {!isSidebarOpen && <div className="border-t border-slate-200 my-1"></div>}
        </div>
      );
    }
    return (
      <Button
        key={item.id}
        variant={activeTab === item.id ? "default" : "ghost"}
        className={`w-full justify-start gap-3 h-9 text-[13px] ${activeTab === item.id ? "bg-indigo-600 hover:bg-indigo-700" : "text-slate-600 hover:text-slate-900"}`}
        onClick={() => setActiveTab(item.id!)}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {isSidebarOpen && <span className="truncate">{item.label}</span>}
      </Button>
    );
  };

  const renderMobileNavItem = (item: MenuItem, index: number) => {
    if (item.section) {
      return (
        <div key={`section-${item.section}`} className={`pt-4 pb-1 px-2 ${index > 0 ? 'mt-2 border-t border-slate-100' : ''}`}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.section}</p>
        </div>
      );
    }
    return (
      <Button
        key={item.id}
        variant={activeTab === item.id ? "default" : "ghost"}
        className={`w-full justify-start gap-3 h-11 text-sm ${activeTab === item.id ? "bg-indigo-600 hover:bg-indigo-700" : "text-slate-600"}`}
        onClick={() => setActiveTab(item.id!)}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span>{item.label}</span>
      </Button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Mobile Header */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
        <span className="font-bold text-lg text-indigo-600 tracking-tight">OmniSync</span>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar - Desktop */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 250 : 72 }}
        className="hidden lg:flex bg-white border-r border-slate-200 flex-col z-20"
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          {isSidebarOpen && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-lg text-indigo-600 tracking-tight">OmniSync</motion.span>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {filteredItems.map((item, i) => renderNavItem(item, i))}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.displayName ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.displayName}` : undefined} />
              <AvatarFallback className="text-xs">{profile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-slate-900 truncate">{profile?.displayName}</p>
                <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 h-9 text-sm"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {isSidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar Content */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isMobileMenuOpen ? 0 : -300 }}
        transition={{ type: 'tween', duration: 0.2 }}
        className="lg:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 flex flex-col shadow-2xl"
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          <span className="font-bold text-lg text-indigo-600 tracking-tight">OmniSync</span>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {filteredItems.map((item, i) => renderMobileNavItem(item, i))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarImage src={profile?.displayName ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.displayName}` : undefined} />
              <AvatarFallback>{profile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">{profile?.displayName}</p>
              <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-center gap-3 text-red-500 border-red-200 hover:bg-red-50 h-10" onClick={logout}>
            <LogOut className="h-4 w-4" /><span>Logout</span>
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-18 lg:pt-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
