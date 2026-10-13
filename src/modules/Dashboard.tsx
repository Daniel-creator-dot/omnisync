import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, FileText, Briefcase, Package, ArrowUpRight, CheckSquare,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { api } from '../lib/api';
import type { DeskTask } from './Desk/Tasks';

interface DashboardProps {
  onOpen: (tab: string) => void;
}

const Dashboard = ({ onOpen }: DashboardProps) => {
  const { profile } = useAuth();
  const { currencySymbol } = useSettings();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    activeEmployees: 0,
    pendingInvoices: 0,
    activePostings: 0,
    totalAssets: 0,
    monthlyHistory: [] as { name: string; revenue: number; expenses: number }[],
  });
  const [tasks, setTasks] = useState<DeskTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [ink, setInk] = useState('#1e293b');

  useEffect(() => {
    const read = () => setInk(document.documentElement.classList.contains('dark') ? '#f4f4f5' : '#1e293b');
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/tasks').catch(() => []),
    ])
      .then(([data, taskRows]) => {
        setStats(data);
        setTasks(taskRows);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const money = (n: number) => `${currencySymbol}${(n ?? 0).toLocaleString()}`;
  const net = (stats.totalRevenue ?? 0) - (stats.totalExpenses ?? 0);
  const history = stats.monthlyHistory?.length
    ? stats.monthlyHistory
    : [{ name: 'Now', revenue: stats.totalRevenue || 0, expenses: stats.totalExpenses || 0 }];
  const openTasks = tasks.filter((task) => task.status === 'open').slice(0, 4);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const shortcuts = [
    { id: 'acc-sales', label: 'New invoice', detail: 'Sales' },
    { id: 'desk-tasks', label: 'Add a task', detail: 'Follow-ups' },
    { id: 'ins-policies', label: 'Policies', detail: 'Insurance' },
    { id: 'employees', label: 'People', detail: 'HR' },
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
      <section className="overflow-hidden rounded-3xl bg-zinc-950 text-white">
        <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_0.8fr] md:p-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">Today</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{greeting}, {profile?.displayName?.split(' ')[0] || 'there'}</h1>
            <p className="mt-2 max-w-md text-sm text-zinc-200">Money, people, and the follow-ups still sitting on the desk.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {shortcuts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpen(item.id)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-white/10"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white/6 p-5">
            <p className="text-xs text-zinc-200">Net so far</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{money(Math.abs(net))}</p>
            <p className={`mt-1 text-sm ${net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {net >= 0 ? 'Ahead of expenses' : 'Expenses are ahead'}
            </p>
          </div>
        </div>
      </section>

      {failed && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The overview numbers could not be loaded. The rest of the desk is still available.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Revenue" value={money(stats.totalRevenue)} note="Paid invoices" icon={TrendingUp} />
        <Metric label="Expenses" value={money(stats.totalExpenses)} note="Approved spend" icon={TrendingDown} />
        <Metric label="Open invoices" value={String(stats.pendingInvoices ?? 0)} note="Waiting on payment" icon={FileText} />
        <Metric label="People" value={String(stats.activeEmployees ?? 0)} note={`${stats.activePostings ?? 0} open roles`} icon={Users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-3xl border border-border bg-card p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Revenue and expenses</h2>
              <p className="text-xs text-muted-foreground">Last six months</p>
            </div>
            <button type="button" onClick={() => onOpen('acc-reports')} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
              Reports <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={ink} strokeOpacity={0.25} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: ink }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: ink }} width={40} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #cbd5e1', background: ink === '#f4f4f5' ? '#18181b' : '#ffffff', color: ink === '#f4f4f5' ? '#fafafa' : '#0f172a', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="#e11d48" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Open tasks</h2>
              <p className="text-xs text-muted-foreground">{openTasks.length === 0 ? 'Nothing waiting' : 'Shared with the desk'}</p>
            </div>
            <button type="button" onClick={() => onOpen('desk-tasks')} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
              <CheckSquare className="h-3.5 w-3.5" /> All
            </button>
          </div>
          {openTasks.length === 0 ? (
            <button type="button" onClick={() => onOpen('desk-tasks')} className="flex h-[220px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
              Add the first follow-up
            </button>
          ) : (
            <ul className="space-y-2">
              {openTasks.map((task) => (
                <li key={task.id} className="rounded-2xl bg-muted/60 px-3 py-3">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    {task.priority}{task.due_date ? ` · ${String(task.due_date).slice(0, 10)}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-3 text-sm">
            <span className="inline-flex items-center gap-2 text-muted-foreground"><Package className="h-4 w-4" /> Assets</span>
            <span className="font-medium">{money(stats.totalAssets)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-3 text-sm">
            <span className="inline-flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4" /> Hiring</span>
            <span className="font-medium">{stats.activePostings ?? 0} open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function Metric({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-indigo-500" />
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

export default Dashboard;
