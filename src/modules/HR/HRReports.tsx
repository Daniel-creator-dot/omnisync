import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Banknote, Printer, UserMinus, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { useSettings } from '../../contexts/SettingsContext';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function amount(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function listOf(value: unknown) {
  return Array.isArray(value) ? value : [];
}

const HRReports = ({ onOpen }: { onOpen?: (tab: string) => void }) => {
  const { currencySymbol } = useSettings();
  const [staff, setStaff] = useState<any[]>([]);
  const [slips, setSlips] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [leave, setLeave] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [postings, setPostings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [onboarding, setOnboarding] = useState<any[]>([]);
  const [exits, setExits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const settled = await Promise.allSettled([
        api.get('/employees'),
        api.get('/payroll'),
        api.get('/payroll/periods'),
        api.get('/leave-requests'),
        api.get('/timesheets'),
        api.get('/recruitment/job-postings'),
        api.get('/performance-reviews'),
        api.get('/training-courses'),
        api.get('/benefits'),
        api.get('/onboarding-tasks'),
        api.get('/exit-management'),
      ]);
      const [people, payroll, periodRows, leaveRows, timeRows, jobs, reviewRows, courseRows, benefitRows, taskRows, exitRows] = settled;
      if (people.status === 'fulfilled') setStaff(listOf(people.value));
      if (payroll.status === 'fulfilled') setSlips(listOf(payroll.value));
      if (periodRows.status === 'fulfilled') setPeriods(listOf(periodRows.value));
      if (leaveRows.status === 'fulfilled') setLeave(listOf(leaveRows.value));
      if (timeRows.status === 'fulfilled') setTimesheets(listOf(timeRows.value));
      if (jobs.status === 'fulfilled') setPostings(listOf(jobs.value));
      if (reviewRows.status === 'fulfilled') setReviews(listOf(reviewRows.value));
      if (courseRows.status === 'fulfilled') setCourses(listOf(courseRows.value));
      if (benefitRows.status === 'fulfilled') setBenefits(listOf(benefitRows.value));
      if (taskRows.status === 'fulfilled') setOnboarding(listOf(taskRows.value));
      if (exitRows.status === 'fulfilled') setExits(listOf(exitRows.value));
      if (people.status === 'rejected' || payroll.status === 'rejected') {
        setError('Staff or payroll could not be loaded. The figures below only include what came back.');
      }
      setLoading(false);
    };
    load();
  }, []);

  const money = (value: number) => `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const active = staff.filter((person) => person.status === 'active');
  const terminated = staff.filter((person) => person.status === 'terminated');
  const other = staff.filter((person) => person.status !== 'active' && person.status !== 'terminated');
  const monthlySalaries = active.reduce((sum, person) => sum + amount(person.salary), 0);
  const approvedNet = slips.filter((slip) => slip.status === 'approved').reduce((sum, slip) => sum + amount(slip.net_salary), 0);
  const paidNet = slips.filter((slip) => slip.status === 'paid').reduce((sum, slip) => sum + amount(slip.net_salary), 0);
  const openRoles = postings.filter((job) => job.status === 'open').length;

  const departments = [...new Set(active.map((person) => person.department || 'Unassigned'))];
  const headcount = departments.map((name) => ({
    name,
    value: active.filter((person) => (person.department || 'Unassigned') === name).length,
  }));

  const latest = periods[0];
  const missing = latest
    ? active.filter((person) => !slips.some((slip) => (
      Number(slip.employee_id) === Number(person.id)
      && Number(slip.month) === Number(latest.month)
      && Number(slip.year) === Number(latest.year)
    )))
    : active;

  const registers = [
    { title: 'Leave requests', count: leave.length, note: `${leave.filter((row) => row.status === 'pending').length} pending`, tab: 'leave', empty: 'No leave requests are on file.' },
    { title: 'Timesheets', count: timesheets.length, note: `${timesheets.filter((row) => row.status === 'submitted').length} waiting`, tab: 'attendance', empty: 'No timesheets are on file.' },
    { title: 'Open roles', count: openRoles, note: `${postings.length} postings`, tab: 'recruitment', empty: 'No job postings are on file.' },
    { title: 'Performance reviews', count: reviews.length, note: 'Ratings on file', tab: 'performance', empty: 'No performance reviews are on file.' },
    { title: 'Training courses', count: courses.length, note: 'Courses on file', tab: 'training', empty: 'No training courses are on file.' },
    { title: 'Benefits', count: benefits.length, note: 'Catalog rows', tab: 'benefits', empty: 'No benefits are on file.' },
    { title: 'Onboarding tasks', count: onboarding.length, note: `${onboarding.filter((row) => !row.completed).length} open`, tab: 'onboarding', empty: 'No onboarding tasks are on file.' },
    { title: 'Exit records', count: exits.length, note: 'Offboarding files', tab: 'exit-management', empty: 'No exit records are on file.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">HR Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Headcount, payroll, and the other HR files that are actually stored.</p>
        </div>
        <Button variant="outline" className="gap-2 print:hidden" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      {error && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs font-medium uppercase text-slate-500">Active staff</p><p className="mt-1 text-2xl font-bold">{loading ? '…' : active.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-medium uppercase text-slate-500">Terminated</p><p className="mt-1 text-2xl font-bold">{loading ? '…' : terminated.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-medium uppercase text-slate-500">Approved, not paid</p><p className="mt-1 text-2xl font-bold">{loading ? '…' : money(approvedNet)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-medium uppercase text-slate-500">Paid on file</p><p className="mt-1 text-2xl font-bold">{loading ? '…' : money(paidNet)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-indigo-500" /> Active headcount</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-slate-500">Loading staff…</p> : headcount.length === 0 ? (
              <p className="text-slate-500">No active staff are on file.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={headcount} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={3}>
                        {headcount.map((_, index) => <Cell key={headcount[index].name} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {headcount.map((row) => (
                    <div key={row.name} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span className="text-sm">{row.name}</span>
                      <span className="font-semibold">{row.value}</span>
                    </div>
                  ))}
                  <p className="text-xs text-slate-500">Monthly salaries on the active records: {money(monthlySalaries)}. Terminated people are left out of this chart.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserMinus className="h-5 w-5 text-rose-500" /> Turnover</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="text-slate-500">Loading…</p> : terminated.length === 0 ? (
              <p className="text-sm text-slate-500">No one is marked terminated.</p>
            ) : terminated.map((person) => (
              <div key={person.id} className="rounded-lg border px-3 py-2">
                <p className="font-medium">{person.name}</p>
                <p className="text-xs text-slate-500">{person.department || 'No department'} · {person.position || 'No position'}</p>
              </div>
            ))}
            {other.length > 0 && <p className="text-xs text-slate-500">{other.length} other status{other.length === 1 ? '' : 'es'} on file.</p>}
            <Button variant="outline" className="w-full print:hidden" onClick={() => onOpen?.('employees')}>Open employees</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-emerald-600" /> Payroll by period</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? <p className="px-6 pb-6 text-slate-500">Loading payslips…</p> : periods.length === 0 ? (
            <p className="px-6 pb-6 text-slate-500">No payslips are on file.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Slips</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period) => (
                    <TableRow key={`${period.year}-${period.month}`}>
                      <TableCell className="font-medium">{MONTHS[(Number(period.month) || 1) - 1]} {period.year}</TableCell>
                      <TableCell>{period.employee_count}</TableCell>
                      <TableCell>{period.pending_count}</TableCell>
                      <TableCell>{period.approved_count}</TableCell>
                      <TableCell>{period.paid_count}</TableCell>
                      <TableCell className="text-right font-semibold">{money(amount(period.total_net))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && latest && missing.length > 0 && (
            <div className="border-t px-4 py-3 text-sm sm:px-6">
              <p className="font-medium">Active staff with no payslip for {MONTHS[(Number(latest.month) || 1) - 1]} {latest.year}</p>
              <ul className="mt-1 space-y-1 text-slate-600">
                {missing.map((person) => (
                  <li key={person.id}>{person.name} — salary {money(amount(person.salary))}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="px-4 pb-4 sm:px-6">
            <Button variant="outline" className="print:hidden" onClick={() => onOpen?.('payroll')}>Open payroll</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {registers.map((row) => (
          <Card key={row.title}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">{row.title}</p>
                <p className="text-2xl font-bold">{loading ? '…' : row.count}</p>
                <p className="text-xs text-slate-500">{loading ? '' : row.count === 0 ? row.empty : row.note}</p>
              </div>
              <Button variant="outline" size="sm" className="print:hidden" onClick={() => onOpen?.(row.tab)}>Open</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Staff on file</CardTitle></CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? <p className="px-6 pb-6 text-slate-500">Loading staff…</p> : staff.length === 0 ? (
            <p className="px-6 pb-6 text-slate-500">No employees are on file.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="hidden md:table-cell">Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Monthly salary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell>{person.department || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell">{person.position || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{person.status || 'unknown'}</Badge></TableCell>
                      <TableCell className="text-right">{money(amount(person.salary))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HRReports;
