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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((data) => {
        setStats(data);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const hasHistory = (stats.monthlyHistory?.length ?? 0) > 0;
  const revenueData = hasHistory
    ? stats.monthlyHistory 
    : [
        { name: 'Jan', revenue: 0, expenses: 0 },
        { name: 'Feb', revenue: 0, expenses: 0 },
        { name: 'Mar', revenue: 0, expenses: 0 },
        { name: 'Apr', revenue: 0, expenses: 0 },
        { name: 'May', revenue: 0, expenses: 0 },
        { name: 'Jun', revenue: 0, expenses: 0 },
      ];

  const hasDepartments = stats.departmentDistribution.length > 0;
  const deptData = hasDepartments
    ? stats.departmentDistribution
    : [{ name: 'None', count: 0 }];

  const money = (n: number) => `${currencySymbol}${(n ?? 0).toLocaleString()}`;
  const net = (stats.totalRevenue ?? 0) - (stats.totalExpenses ?? 0);

  const cards = [
    { label: 'Revenue', value: money(stats.totalRevenue), note: 'Paid invoices', icon: DollarSign, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Expenses', value: money(stats.totalExpenses), note: 'Approved spend', icon: CreditCard, tone: 'bg-rose-50 text-rose-700' },
    { label: 'People', value: String(stats.activeEmployees ?? 0), note: 'Active employees', icon: Users, tone: 'bg-indigo-50 text-indigo-700' },
    { label: 'Invoices', value: String(stats.pendingInvoices ?? 0), note: 'Waiting on payment', icon: FileText, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Hiring', value: String(stats.activePostings ?? 0), note: 'Open postings', icon: Briefcase, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Assets', value: money(stats.totalAssets), note: 'Fixed asset value', icon: Package, tone: 'bg-slate-100 text-slate-700' },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-600">Overview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Good to see you, {profile?.displayName || 'there'}</h1>
          <p className="mt-1 text-sm text-slate-500">Revenue, people, and open work in one view.</p>
        </div>
        <p className={`text-sm font-medium ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          Net {money(Math.abs(net))} {net < 0 ? 'short' : 'ahead'}
        </p>
      </div>

      {failed && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The overview numbers could not be loaded. The rest of the desk is still available.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="gap-3 bg-white py-4">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardTitle className="text-xs font-medium text-slate-500">{card.label}</CardTitle>
              <span className={`flex h-7 w-7 items-center justify-center rounded-md ${card.tone}`}>
                <card.icon className="h-3.5 w-3.5" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold tracking-tight text-slate-950">{card.value}</div>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                {card.label === 'Revenue' && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                {card.label === 'Expenses' && <TrendingDown className="h-3 w-3 text-rose-600" />}
                {card.note}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="bg-white p-5 lg:col-span-3">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-semibold text-slate-950">Revenue and expenses</CardTitle>
            <p className="text-xs text-slate-500">{hasHistory ? 'Monthly movement' : 'No monthly history yet'}</p>
          </CardHeader>
          <div className="mt-2 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.16}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={40} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="#e11d48" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-white p-5 lg:col-span-2">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base font-semibold text-slate-950">Departments</CardTitle>
            <p className="text-xs text-slate-500">{hasDepartments ? 'Headcount by team' : 'No department data yet'}</p>
          </CardHeader>
          {hasDepartments ? (
            <div className="mt-2 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={28} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-6 flex h-[220px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              Departments will show here once people are assigned.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
