import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  FileText, 
  Briefcase,
  Package,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { api } from '../lib/api';

const Dashboard = () => {
  const { profile } = useAuth();
  const { currencySymbol } = useSettings();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    activeEmployees: 0,
    pendingInvoices: 0,
    activePostings: 0,
    totalAssets: 0,
    departmentDistribution: [] as { name: string; count: number }[],
    monthlyHistory: [] as { name: string; revenue: number; expenses: number }[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((data) => {
        setStats(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const revenueData = (stats.monthlyHistory?.length ?? 0) > 0 
    ? stats.monthlyHistory 
    : [
        { name: 'Jan', revenue: 0, expenses: 0 },
        { name: 'Feb', revenue: 0, expenses: 0 },
        { name: 'Mar', revenue: 0, expenses: 0 },
        { name: 'Apr', revenue: 0, expenses: 0 },
        { name: 'May', revenue: 0, expenses: 0 },
        { name: 'Jun', revenue: 0, expenses: 0 },
      ];

  const deptData = stats.departmentDistribution.length > 0
    ? stats.departmentDistribution
    : [{ name: 'No data', count: 0 }];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Financial Overview</h1>
          <p className="text-slate-500">Welcome back, {profile?.displayName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs md:text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{currencySymbol}{(stats.totalRevenue ?? 0).toLocaleString()}</div>
            <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> From paid invoices
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{currencySymbol}{(stats.totalExpenses ?? 0).toLocaleString()}</div>
            <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3" /> Approved expenses
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.activeEmployees ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Across departments</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.pendingInvoices ?? 0}</div>
            <p className="text-xs text-amber-500 mt-1">Action required</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Postings</CardTitle>
            <Briefcase className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.activePostings ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Hiring in progress</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Asset Value</CardTitle>
            <Package className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{currencySymbol}{(stats.totalAssets ?? 0).toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Fixed assets total</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 bg-white border-slate-200 shadow-sm">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold text-slate-900">Revenue vs Expenses</CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 bg-white border-slate-200 shadow-sm">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg font-semibold text-slate-900">Department Distribution</CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
