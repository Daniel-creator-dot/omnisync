import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Trash2, Receipt, DollarSign, Clock, Eye, Calendar, CreditCard, Tag, User, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'sonner';

const Expenses = () => {
  const { profile } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<any | null>(null);
  const { currencySymbol } = useSettings();
  const [spend, setSpend] = useState({ accountId: '', paidFromId: '', amount: 0, date: new Date().toISOString().split('T')[0], description: '' });

  const fetchData = async () => {
    const [expenseResult, activityResult, accountResult] = await Promise.allSettled([
      api.get('/expenses'),
      api.get('/expenses/activity'),
      api.get('/accounts'),
    ]);
    setExpenses(expenseResult.status === 'fulfilled' && Array.isArray(expenseResult.value) ? expenseResult.value : []);
    setActivity(activityResult.status === 'fulfilled' && Array.isArray(activityResult.value) ? activityResult.value : []);
    const books = accountResult.status === 'fulfilled' && Array.isArray(accountResult.value) ? accountResult.value : [];
    setAccounts(books);
    setSpend((current) => ({
      ...current,
      accountId: current.accountId || String(books.find((account) => account.type === 'expense')?.id || ''),
      paidFromId: current.paidFromId || String(books.find((account) => account.type === 'asset' && /bank|cash/i.test(account.name))?.id || books.find((account) => account.type === 'asset')?.id || ''),
    }));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const recordSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses/spend', { ...spend, amount: Number(spend.amount) });
      toast.success('Spend posted to the ledger');
      setIsAddOpen(false);
      setSpend((current) => ({ ...current, amount: 0, description: '' }));
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await api.put(`/expenses/${id}`, { status }); toast.success(`Expense ${status}`); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/expenses/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const canApprove = profile?.role === 'admin' || profile?.role === 'accountant';
  const ledgerTotal = activity.reduce((sum, line) => sum + Number(line.amount || 0), 0);
  const pendingCount = expenses.filter(e => e.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">Spend already in the ledger, plus claims still waiting for approval.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Record spend</DialogTrigger>
          <DialogContent className="sm:max-w-[500px] w-[95vw]">
            <DialogHeader><DialogTitle>Record spend</DialogTitle></DialogHeader>
            <form onSubmit={recordSpend} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Expense account</Label>
                <Select value={spend.accountId} onValueChange={(value: string) => setSpend({ ...spend, accountId: value })}>
                  <SelectTrigger><SelectValue placeholder="Choose an account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.filter((account) => account.type === 'expense').map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>{account.code} {account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Paid from</Label>
                <Select value={spend.paidFromId} onValueChange={(value: string) => setSpend({ ...spend, paidFromId: value })}>
                  <SelectTrigger><SelectValue placeholder="Cash or bank" /></SelectTrigger>
                  <SelectContent>
                    {accounts.filter((account) => account.type === 'asset').map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>{account.code} {account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Amount ({currencySymbol})</Label><Input type="number" step="0.01" min="0.01" value={spend.amount} onChange={(event) => setSpend({ ...spend, amount: Number(event.target.value) })} required /></div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={spend.date} onChange={(event) => setSpend({ ...spend, date: event.target.value })} required /></div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Input value={spend.description} onChange={(event) => setSpend({ ...spend, description: event.target.value })} placeholder="What was this for?" required /></div>
              <Button type="submit" className="w-full bg-indigo-600" disabled={!spend.accountId || !spend.paidFromId}>Post to the ledger</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-rose-100 p-2 rounded-lg"><DollarSign className="h-5 w-5 text-rose-600" /></div><div><p className="text-xs text-muted-foreground">Ledger spend</p><p className="text-2xl font-bold text-rose-600">{currencySymbol}{ledgerTotal.toLocaleString(undefined, {minimumFractionDigits:2})}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-lg"><Receipt className="h-5 w-5 text-indigo-600" /></div><div><p className="text-xs text-muted-foreground">Ledger lines</p><p className="text-2xl font-bold">{activity.length}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-amber-100 p-2 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div><div><p className="text-xs text-muted-foreground">Claims waiting</p><p className="text-2xl font-bold text-amber-600">{pendingCount}</p></div></div></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Spend in the ledger</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Account</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow> :
                activity.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No spend is in the ledger yet.</TableCell></TableRow> :
                activity.map((line, index) => (
                  <TableRow key={`${line.journal_id}-${line.account_id}-${index}`}>
                    <TableCell className="text-muted-foreground">{line.date ? new Date(line.date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="font-medium">{line.code} {line.account_name}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{line.description || line.reference || 'Journal'}</TableCell>
                    <TableCell className={Number(line.amount) < 0 ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>{currencySymbol}{Number(line.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 overflow-hidden">
        <CardHeader><CardTitle>All Expenses</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Loading...</TableCell></TableRow> :
                expenses.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No claims are waiting.</TableCell></TableRow> :
                expenses.map((exp: any) => (
                  <TableRow key={exp.id}>
                    <TableCell><div><p className="font-medium">{exp.category}</p><p className="text-xs text-slate-400 sm:hidden">{exp.date ? new Date(exp.date).toLocaleDateString() : ''}</p></div></TableCell>
                    <TableCell className="font-bold">{currencySymbol}{parseFloat(exp.amount).toLocaleString(undefined, {minimumFractionDigits:2})}</TableCell>
                    <TableCell className="hidden sm:table-cell text-slate-500">{exp.date ? new Date(exp.date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[200px] truncate text-slate-500">{exp.description}</TableCell>
                    <TableCell><Badge className={exp.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : exp.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}>{exp.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingExpense(exp)} title="View Details">
                          <Eye className="h-4 w-4 text-indigo-500" />
                        </Button>
                        {canApprove && exp.status === 'pending' && (<>
                          <Button variant="ghost" size="icon" onClick={() => updateStatus(exp.id, 'approved')} className="text-emerald-500" title="Approve">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => updateStatus(exp.id, 'rejected')} className="text-rose-500" title="Reject">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>)}
                        <Button variant="ghost" size="icon" onClick={() => deleteExpense(exp.id)} className="text-red-500 h-8 w-8" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* View Expense Details Modal */}
      <Dialog open={!!viewingExpense} onOpenChange={() => setViewingExpense(null)}>
        <DialogContent className="sm:max-w-[500px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-600" />
              Expense Voucher Detail
            </DialogTitle>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-6 py-4">
              <div className="relative overflow-hidden bg-slate-900 text-white rounded-2xl p-6 shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Receipt className="h-20 w-20" />
                </div>
                <div className="relative z-10">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Amount</p>
                  <h2 className="text-4xl font-black">{currencySymbol}{parseFloat(viewingExpense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge className={viewingExpense.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : viewingExpense.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}>
                      {viewingExpense.status?.toUpperCase()}
                    </Badge>
                    <span className="text-slate-500 text-xs font-mono">REF: EXP-{viewingExpense.id.toString().padStart(4, '0')}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-xl bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{viewingExpense.category}</p>
                </div>
                <div className="p-3 border rounded-xl bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{new Date(viewingExpense.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg text-slate-500"><CreditCard className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Information</p>
                    <p className="text-sm font-medium text-slate-700 capitalize">{viewingExpense.payment_method || viewingExpense.paymentMethod || 'Cash'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg text-slate-500"><User className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted By</p>
                    <p className="text-sm font-medium text-slate-700">{viewingExpense.submitted_by || 'System User'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg text-slate-500"><Receipt className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</p>
                    <div className="mt-1 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 italic border border-slate-100">
                      "{viewingExpense.description || 'No additional details provided for this expense claim.'}"
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setViewingExpense(null)} className="flex-1">Close</Button>
                {canApprove && viewingExpense.status === 'pending' && (
                  <div className="flex gap-2 flex-[2]">
                    <Button 
                      variant="outline" 
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 flex-1"
                      onClick={() => { updateStatus(viewingExpense.id, 'rejected'); setViewingExpense(null); }}
                    >
                      Reject
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                      onClick={() => { updateStatus(viewingExpense.id, 'approved'); setViewingExpense(null); }}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
