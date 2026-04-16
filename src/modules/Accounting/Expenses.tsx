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
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<any | null>(null);
  const { currencySymbol } = useSettings();
  const [newExpense, setNewExpense] = useState({ category: '', amount: 0, date: new Date().toISOString().split('T')[0], description: '', paymentMethod: 'cash' });

  const fetchData = async () => {
    try { const data = await api.get('/expenses'); setExpenses(data); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/expenses', { ...newExpense, amount: Number(newExpense.amount), status: 'pending' }); toast.success('Expense added'); setIsAddOpen(false); setNewExpense({ category: '', amount: 0, date: new Date().toISOString().split('T')[0], description: '', paymentMethod: 'cash' }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
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
  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const pendingCount = expenses.filter(e => e.status === 'pending').length;
  const approvedTotal = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  const categories = ['Office Supplies', 'Travel', 'Software', 'Marketing', 'Utilities', 'Insurance', 'Meals', 'Equipment', 'Professional Services', 'Other'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Expenses</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Add Expense</DialogTrigger>
          <DialogContent className="sm:max-w-[500px] w-[95vw]">
            <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Category</Label>
                  <Select onValueChange={(v: string) => setNewExpense({...newExpense, category: v})} required>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Payment Method</Label>
                  <Select value={newExpense.paymentMethod} onValueChange={(v: string) => setNewExpense({...newExpense, paymentMethod: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="credit_card">Credit Card</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="check">Check</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Amount ({currencySymbol})</Label><Input type="number" step="0.01" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} required /></div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} required /></div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Input value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="What was this expense for?" /></div>
              <Button type="submit" className="w-full bg-indigo-600">Add Expense</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-rose-100 p-2 rounded-lg"><DollarSign className="h-5 w-5 text-rose-600" /></div><div><p className="text-xs text-slate-500">Total Expenses</p><p className="text-2xl font-bold text-rose-600">{currencySymbol}{totalExpenses.toLocaleString(undefined, {minimumFractionDigits:2})}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-amber-100 p-2 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div><div><p className="text-xs text-slate-500">Pending Approval</p><p className="text-2xl font-bold text-amber-600">{pendingCount}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-emerald-100 p-2 rounded-lg"><Receipt className="h-5 w-5 text-emerald-600" /></div><div><p className="text-xs text-slate-500">Approved</p><p className="text-2xl font-bold text-emerald-600">{currencySymbol}{approvedTotal.toLocaleString(undefined, {minimumFractionDigits:2})}</p></div></div></Card>
      </div>

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
                expenses.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">No expenses.</TableCell></TableRow> :
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
