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

const PayrollModule = () => {
  const [periods, setPeriods] = useState<any[]>([]);
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [periodRecords, setPeriodRecords] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [isRunOpen, setIsRunOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);
  const { currencySymbol } = useSettings();
  const [processing, setProcessing] = useState(false);
  const [batchForm, setBatchForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    bonusPercent: 0,
    deductionPercent: 0,
  });

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const fetchPeriods = async () => {
    try {
      const data = await api.get('/payroll/periods');
      setPeriods(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
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
    setProcessing(true);
    try {
      const result = await api.post('/payroll/run-batch', batchForm);
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
    if (!confirm(`Approve and mark all payroll for ${months[month - 1]} ${year} as paid?`)) return;
    try {
      const result = await api.put('/payroll/approve-batch', { month, year });
      toast.success(result.message || 'Batch approved');
      const key = `${month}-${year}`;
      setPeriodRecords(prev => ({ ...prev, [key]: undefined as any }));
      fetchPeriodRecords(month, year);
      fetchPeriods();
    } catch (error: any) { toast.error(error.message); }
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Payroll</h1>
        <Dialog open={isRunOpen} onOpenChange={setIsRunOpen}>
          <DialogTrigger render={<Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 gap-2" />}>
            <Play className="h-4 w-4" /> Run Payroll
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Run Batch Payroll</DialogTitle></DialogHeader>
            <p className="text-sm text-slate-500 mt-1">This will process payroll for <strong>all active employees</strong> based on their salary.</p>
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
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700"><strong>Note:</strong> Payroll will be calculated for all active employees using their recorded salary as the base. Bonus and deduction percentages are applied on top.</p>
              </div>
              <Button type="submit" className="w-full bg-indigo-600" disabled={processing}>
                {processing ? 'Processing...' : 'Run Payroll for All Employees'}
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
                          <Button variant="ghost" size="sm" onClick={() => approveBatch(period.month, period.year)} className="text-emerald-500 hover:text-emerald-700 gap-1" title="Approve all">
                            <CheckCircle className="h-4 w-4" /> <span className="hidden sm:inline">Approve</span>
                          </Button>
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
                                      <Badge className={r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{r.status}</Badge>
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
                      <Badge className={viewingRecord.status === 'paid' ? 'bg-emerald-400/20 text-emerald-50 text-xs border-emerald-400/30' : 'bg-amber-400/20 text-amber-50 text-xs border-amber-400/30'}>
                        {viewingRecord.status.toUpperCase()}
                      </Badge>
                      <p className="text-[10px] text-indigo-200 mt-2 font-mono">ID: {viewingRecord.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg text-indigo-700 border border-indigo-100 text-xs">
                <Info className="h-4 w-4 shrink-0" />
                <p>This is an electronic payslip generated by the OmniSync HR System. All amounts are calculated based on registered employment terms.</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingRecord(null)}>Close Payslip</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollModule;
