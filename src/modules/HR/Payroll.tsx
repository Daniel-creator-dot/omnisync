import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Play, CheckCircle, Trash2, DollarSign, Users, Calendar, ChevronDown, ChevronRight, Eye, Briefcase, User, Info, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'sonner';

function MissingPayslips({ periods, slips, staff, months }: { periods: any[]; slips: any[]; staff: any[]; months: string[] }) {
  const latest = periods[0];
  if (!latest) return null;
  const covered = new Set(
    slips
      .filter((slip) => Number(slip.month) === Number(latest.month) && Number(slip.year) === Number(latest.year))
      .map((slip) => Number(slip.employee_id))
  );
  const missing = staff.filter((person) => person.status === 'active' && !covered.has(Number(person.id)));
  if (missing.length === 0) return null;
  const label = `${months[(Number(latest.month) || 1) - 1]} ${latest.year}`;
  return (
    <div className="border-t px-4 sm:px-6 py-3 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Active staff with no payslip for {label}</p>
      <ul className="mt-1 space-y-1">
        {missing.map((person) => (
          <li key={person.id}>{person.name} — salary {Number(person.salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</li>
        ))}
      </ul>
    </div>
  );
}

const PayrollModule = () => {
  const [periods, setPeriods] = useState<any[]>([]);
  const [slips, setSlips] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [periodRecords, setPeriodRecords] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [isRunOpen, setIsRunOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);
  const { currencySymbol } = useSettings();
  const [processing, setProcessing] = useState(false);
  const [payTarget, setPayTarget] = useState<{ month: number; year: number } | null>(null);
  const [payAccounts, setPayAccounts] = useState<any[]>([]);
  const [payBanks, setPayBanks] = useState<any[]>([]);
  const [payForm, setPayForm] = useState({ salaryAccountId: 'create-salaries', paidFromAccountId: '', bankAccountId: '' });
  const [paying, setPaying] = useState(false);
  const [batchForm, setBatchForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    bonusPercent: 0,
    deductionPercent: 0,
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  useEffect(() => {
    if (isRunOpen) {
      const fetchActiveEmployees = async () => {
        try {
          const data = await api.get('/employees');
          const activeEmps = data.filter((emp: any) => emp.status === 'active');
          setEmployees(activeEmps);
          setSelectedEmployeeIds(activeEmps.map((emp: any) => emp.id));
        } catch (error) {
          toast.error('Failed to fetch active employees for selection');
          console.error(error);
        }
      };
      fetchActiveEmployees();
    }
  }, [isRunOpen]);

  const handleSelectEmployee = (id: number) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedEmployeeIds.length === employees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(employees.map(emp => emp.id));
    }
  };

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const fetchPeriods = async () => {
    const [periodResult, slipResult, staffResult] = await Promise.allSettled([
      api.get('/payroll/periods'),
      api.get('/payroll'),
      api.get('/employees'),
    ]);
    setPeriods(periodResult.status === 'fulfilled' && Array.isArray(periodResult.value) ? periodResult.value : []);
    setSlips(slipResult.status === 'fulfilled' && Array.isArray(slipResult.value) ? slipResult.value : []);
    setStaff(staffResult.status === 'fulfilled' && Array.isArray(staffResult.value) ? staffResult.value : []);
    if (periodResult.status === 'rejected' && slipResult.status === 'rejected') {
      toast.error('Payroll could not be loaded');
    }
    setLoading(false);
  };

  useEffect(() => { fetchPeriods(); }, []);

  const fetchPeriodRecords = async (month: number, year: number) => {
    const key = `${month}-${year}`;
    try {
      const data = await api.get(`/payroll?month=${month}&year=${year}`);
      setPeriodRecords(prev => ({ ...prev, [key]: data }));
    } catch (error) { console.error(error); }
  };

  const togglePeriod = (month: number, year: number) => {
    const key = `${month}-${year}`;
    if (expandedPeriod === key) {
      setExpandedPeriod(null);
    } else {
      setExpandedPeriod(key);
      if (!periodRecords[key]) {
        fetchPeriodRecords(month, year);
      }
    }
  };

  const runBatchPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployeeIds.length === 0) {
      toast.error('Please select at least one employee to run payroll for.');
      return;
    }
    setProcessing(true);
    try {
      const result = await api.post('/payroll/run-batch', {
        ...batchForm,
        employeeIds: selectedEmployeeIds
      });
      toast.success(result.message || 'Payroll processed');
      setIsRunOpen(false);
      setBatchForm({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), bonusPercent: 0, deductionPercent: 0 });
      setExpandedPeriod(null);
      setPeriodRecords({});
      fetchPeriods();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process payroll');
    } finally {
      setProcessing(false);
    }
  };

  const approveBatch = async (month: number, year: number) => {
    if (!confirm(`Approve all payroll records for ${months[month - 1]} ${year}?`)) return;
    try {
      const result = await api.put('/payroll/approve-batch', { month, year });
      toast.success(result.message || 'Batch approved');
      const key = `${month}-${year}`;
      setPeriodRecords(prev => ({ ...prev, [key]: undefined as any }));
      fetchPeriodRecords(month, year);
      fetchPeriods();
    } catch (error: any) { toast.error(error.message); }
  };

  const openPay = async (month: number, year: number) => {
    setPayTarget({ month, year });
    try {
      const [books, banks] = await Promise.all([api.get('/accounts'), api.get('/banking/accounts')]);
      const accountRows = Array.isArray(books) ? books : [];
      const bankRows = Array.isArray(banks) ? banks : [];
      setPayAccounts(accountRows);
      setPayBanks(bankRows);
      const salary = accountRows.find((account) => account.type === 'expense' && /salary|wage|payroll/i.test(account.name));
      const cash = accountRows.find((account) => account.type === 'asset' && /bank|cash/i.test(account.name));
      const bank = bankRows.find((row) => /absa/i.test(`${row.bank_name} ${row.name}`)) || bankRows[0];
      setPayForm({
        salaryAccountId: salary ? String(salary.id) : 'create-salaries',
        paidFromAccountId: cash ? String(cash.id) : '',
        bankAccountId: bank ? String(bank.id) : '',
      });
    } catch (error: any) {
      toast.error(error.message || 'The paying accounts could not be loaded');
    }
  };

  const payBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!payTarget) return;
    setPaying(true);
    try {
      const result = await api.put('/payroll/pay-batch', {
        month: payTarget.month,
        year: payTarget.year,
        paidFromAccountId: Number(payForm.paidFromAccountId),
        salaryAccountId: payForm.salaryAccountId === 'create-salaries' ? undefined : Number(payForm.salaryAccountId),
        bankAccountId: Number(payForm.bankAccountId),
      });
      toast.success(result.message || 'Payroll paid');
      const key = `${payTarget.month}-${payTarget.year}`;
      setPayTarget(null);
      setPeriodRecords(prev => ({ ...prev, [key]: undefined as any }));
      fetchPeriodRecords(payTarget.month, payTarget.year);
      fetchPeriods();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPaying(false);
    }
  };

  const deletePeriod = async (month: number, year: number) => {
    if (!confirm(`Delete ALL payroll records for ${months[month - 1]} ${year}? This cannot be undone.`)) return;
    try {
      await api.delete(`/payroll/period?month=${month}&year=${year}`);
      toast.success('Period deleted');
      const key = `${month}-${year}`;
      setExpandedPeriod(null);
      setPeriodRecords(prev => { const n = { ...prev }; delete n[key]; return n; });
      fetchPeriods();
    } catch (error: any) { toast.error(error.message); }
  };

  // Summary stats
  const totalNet = periods.reduce((sum, p) => sum + parseFloat(p.total_net || 0), 0);
  const totalEmployees = periods.length > 0 ? periods[0].employee_count : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Payroll</h1>
        <Dialog open={isRunOpen} onOpenChange={setIsRunOpen}>
          <DialogTrigger render={<Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 gap-2" />}>
            <Play className="h-4 w-4" /> Run Payroll
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Run Batch Payroll</DialogTitle></DialogHeader>
            <p className="text-sm text-slate-500 mt-1">This will process payroll for the selected active employees based on their salary.</p>
            <form onSubmit={runBatchPayroll} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={batchForm.month.toString()} onValueChange={(v: string) => setBatchForm({...batchForm, month: Number(v)})}>
                    <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                    <SelectContent>{months.map((m, i) => (<SelectItem key={i} value={(i+1).toString()}>{m}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="number" value={batchForm.year} onChange={e => setBatchForm({...batchForm, year: Number(e.target.value)})} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bonus %</Label>
                  <Input type="number" step="0.1" min="0" max="100" value={batchForm.bonusPercent} onChange={e => setBatchForm({...batchForm, bonusPercent: Number(e.target.value)})} />
                  <p className="text-xs text-slate-400">Applied to base salary</p>
                </div>
                <div className="space-y-2">
                  <Label>Deduction %</Label>
                  <Input type="number" step="0.1" min="0" max="100" value={batchForm.deductionPercent} onChange={e => setBatchForm({...batchForm, deductionPercent: Number(e.target.value)})} />
                  <p className="text-xs text-slate-400">Applied to base salary</p>
                </div>
              </div>
              
              {/* Staff Selector Checkbox List */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Select Staff to Process</Label>
                  <button 
                    type="button" 
                    onClick={handleToggleAll} 
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {selectedEmployeeIds.length === employees.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 max-h-[180px] overflow-y-auto space-y-2 bg-slate-50">
                  {employees.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-2">No active employees found.</p>
                  ) : (
                    employees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-100/50 p-1 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedEmployeeIds.includes(emp.id)}
                          onChange={() => handleSelectEmployee(emp.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{emp.name} <span className="text-xs text-slate-400">({emp.department})</span></span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-slate-400">{selectedEmployeeIds.length} of {employees.length} staff selected</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700"><strong>Note:</strong> Payroll will be calculated using employee salary as base. Batch bonus/deduction percentages and employee-specific deductions will be applied automatically.</p>
              </div>
              <Button type="submit" className="w-full bg-indigo-600" disabled={processing || selectedEmployeeIds.length === 0}>
                {processing ? 'Processing...' : `Run Payroll for ${selectedEmployeeIds.length} Selected Staff`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg"><Calendar className="h-5 w-5 text-indigo-600" /></div>
            <div><p className="text-sm text-slate-500">Periods Processed</p><p className="text-2xl font-bold text-slate-900">{periods.length}</p></div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg"><Users className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-sm text-slate-500">Latest Batch Size</p><p className="text-2xl font-bold text-slate-900">{totalEmployees}</p></div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-violet-100 p-2 rounded-lg"><DollarSign className="h-5 w-5 text-violet-600" /></div>
            <div><p className="text-sm text-slate-500">Total Net Paid</p><p className="text-2xl font-bold text-slate-900">{currencySymbol}{totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg font-semibold">Payslips on file</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-10 text-muted-foreground">Loading payslips...</p>
          ) : slips.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">No payslips are stored yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slips.map((slip) => (
                    <TableRow key={slip.id}>
                      <TableCell className="font-medium">{slip.employee_name}</TableCell>
                      <TableCell>{months[(Number(slip.month) || 1) - 1]} {slip.year}</TableCell>
                      <TableCell className="font-bold">{currencySymbol}{parseFloat(slip.net_salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell><Badge variant="outline">{slip.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && periods[0] && staff.length > 0 && (
            <MissingPayslips periods={periods} slips={slips} staff={staff} months={months} />
          )}
        </CardContent>
      </Card>

      {/* Payroll Periods */}
      <Card className="bg-white border-slate-200 overflow-hidden">
        <CardHeader className="px-4 sm:px-6"><CardTitle className="text-lg font-semibold">Payroll Periods</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center py-10 text-slate-500">Loading payroll...</p>
          ) : periods.length === 0 ? (
            <p className="text-center py-10 text-slate-500">No payroll has been processed yet. Click "Run Payroll" to get started.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {periods.map((period: any) => {
                const key = `${period.month}-${period.year}`;
                const isExpanded = expandedPeriod === key;
                const records = periodRecords[key] || [];
                const hasPending = records.some((r: any) => r.status === 'pending');

                return (
                  <div key={key}>
                    {/* Period Header */}
                    <div
                      className="flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => togglePeriod(period.month, period.year)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                        <div>
                          <p className="font-semibold text-slate-900">{months[(period.month || 1) - 1]} {period.year}</p>
                          <p className="text-sm text-slate-500">{period.employee_count} employees</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-slate-900">{currencySymbol}{parseFloat(period.total_net || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          {period.pending_count > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => approveBatch(period.month, period.year)} className="text-amber-600 hover:text-amber-800 gap-1" title="Approve pending">
                              <CheckCircle className="h-4 w-4" /> <span className="hidden sm:inline">Approve</span>
                            </Button>
                          )}
                          {period.approved_count > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => openPay(period.month, period.year)} className="text-emerald-600 hover:text-emerald-800 gap-1" title="Pay approved">
                              <DollarSign className="h-4 w-4" /> <span className="hidden sm:inline">Pay Staff</span>
                            </Button>
                          )}
                          {period.pending_count === 0 && period.approved_count === 0 && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-100 shrink-0 self-center">Fully Paid</Badge>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deletePeriod(period.month, period.year)} className="text-red-500 hover:text-red-700" title="Delete period">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Records */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-100">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-100/50">
                                <TableHead>Employee</TableHead>
                                <TableHead>Base Salary</TableHead>
                                <TableHead className="hidden md:table-cell">Bonuses</TableHead>
                                <TableHead className="hidden md:table-cell">Deductions</TableHead>
                                <TableHead>Net Salary</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {records.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-6 text-slate-400">Loading records...</TableCell></TableRow>
                              ) : (
                                records.map((r: any) => (
                                  <TableRow key={r.id}>
                                    <TableCell className="font-medium">{r.employee_name}</TableCell>
                                    <TableCell>{currencySymbol}{parseFloat(r.base_salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="hidden md:table-cell text-emerald-600">+{currencySymbol}{parseFloat(r.bonuses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="hidden md:table-cell text-rose-600">-{currencySymbol}{parseFloat(r.deductions || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="font-bold">{currencySymbol}{parseFloat(r.net_salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell>
                                      <Badge className={
                                        r.status === 'paid' 
                                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none' 
                                          : r.status === 'approved' 
                                            ? 'bg-sky-100 text-sky-700 hover:bg-sky-100 border-none' 
                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none'
                                      }>
                                        {r.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" onClick={() => setViewingRecord(r)} title="View Payslip">
                                        <Eye className="h-4 w-4 text-indigo-500" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {/* View Payslip Modal */}
      <Dialog open={!!viewingRecord} onOpenChange={() => setViewingRecord(null)}>
        <DialogContent className="sm:max-w-[600px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-indigo-600" />
              Employee Payslip Detail
            </DialogTitle>
          </DialogHeader>
          
          {viewingRecord && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2.5 rounded-full shadow-sm">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{viewingRecord.employee_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Briefcase className="h-3 w-3" />
                      Employee ID: {viewingRecord.employee_id}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payroll Period</p>
                  <p className="text-sm font-bold text-slate-700">{months[viewingRecord.month - 1]} {viewingRecord.year}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-500 uppercase">Earnings</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Base Salary</span>
                        <span className="font-medium">{currencySymbol}{parseFloat(viewingRecord.base_salary || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Bonuses</span>
                        <span className="font-medium">+{currencySymbol}{parseFloat(viewingRecord.bonuses || 0).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold text-slate-900">
                        <span>Gross Total</span>
                        <span>{currencySymbol}{(parseFloat(viewingRecord.base_salary || 0) + parseFloat(viewingRecord.bonuses || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 mb-3">
                      <Trash2 className="h-4 w-4 text-rose-500" />
                      <span className="text-xs font-bold text-slate-500 uppercase">Deductions</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-rose-600">
                        <span>Standard Deductions</span>
                        <span className="font-medium">-{currencySymbol}{parseFloat(viewingRecord.deductions || 0).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold text-rose-700">
                        <span>Total Deductions</span>
                        <span>-{currencySymbol}{parseFloat(viewingRecord.deductions || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-600 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <DollarSign className="h-16 w-16" />
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Net Payable Amount</p>
                      <h4 className="text-3xl font-black">{currencySymbol}{parseFloat(viewingRecord.net_salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                    </div>
                    <div className="text-right">
                      <Badge className={
                        viewingRecord.status === 'paid' 
                          ? 'bg-emerald-400/20 text-emerald-50 text-xs border-emerald-400/30 hover:bg-emerald-400/20' 
                          : viewingRecord.status === 'approved'
                            ? 'bg-sky-400/20 text-sky-50 text-xs border-sky-400/30 hover:bg-sky-400/20'
                            : 'bg-amber-400/20 text-amber-50 text-xs border-amber-400/30 hover:bg-amber-400/20'
                      }>
                        {viewingRecord.status.toUpperCase()}
                      </Badge>
                      <p className="text-[10px] text-indigo-200 mt-2 font-mono">ID: {viewingRecord.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg text-indigo-700 border border-indigo-100 text-xs">
                <Info className="h-4 w-4 shrink-0" />
                <p>This is an electronic payslip generated by the Bytz360 HR System. All amounts are calculated based on registered employment terms.</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingRecord(null)}>Close Payslip</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!payTarget} onOpenChange={() => setPayTarget(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Pay {payTarget ? `${months[payTarget.month - 1]} ${payTarget.year}` : 'payroll'}</DialogTitle>
          </DialogHeader>
          {payTarget && (
            <form onSubmit={payBatch} className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Approved net for this period is {currencySymbol}
                {slips
                  .filter((slip) => Number(slip.month) === payTarget.month && Number(slip.year) === payTarget.year && slip.status === 'approved')
                  .reduce((sum, slip) => sum + Number(slip.net_salary || 0), 0)
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                . The wages are posted to the ledger and the same amount leaves the bank account you choose.
              </p>
              <div className="space-y-2">
                <Label>Salary account</Label>
                <Select value={payForm.salaryAccountId} onValueChange={(value: string) => setPayForm({ ...payForm, salaryAccountId: value })}>
                  <SelectTrigger><SelectValue placeholder="Salary account" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create-salaries">5510 Salaries and Wages</SelectItem>
                    {payAccounts.filter((account) => account.type === 'expense').map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>{account.code} {account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credit this ledger account</Label>
                <Select value={payForm.paidFromAccountId} onValueChange={(value: string) => setPayForm({ ...payForm, paidFromAccountId: value })}>
                  <SelectTrigger><SelectValue placeholder="Cash or bank in the ledger" /></SelectTrigger>
                  <SelectContent>
                    {payAccounts.filter((account) => account.type === 'asset').map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>{account.code} {account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reduce this bank balance</Label>
                <Select value={payForm.bankAccountId} onValueChange={(value: string) => setPayForm({ ...payForm, bankAccountId: value })}>
                  <SelectTrigger><SelectValue placeholder="Bank account" /></SelectTrigger>
                  <SelectContent>
                    {payBanks.map((bank) => (
                      <SelectItem key={bank.id} value={String(bank.id)}>
                        {bank.name} · {bank.bank_name} · {Number(bank.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-indigo-600" disabled={paying || !payForm.paidFromAccountId || !payForm.bankAccountId}>
                {paying ? 'Paying...' : 'Pay and post'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollModule;
