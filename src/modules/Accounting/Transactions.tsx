import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { ArrowUpRight, ArrowDownRight, DollarSign, Eye, Info, Calendar, FileText, Hash, CheckCircle, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useSettings } from '../../contexts/SettingsContext';
import { Button } from '../../components/ui/button';

const Transactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingTxn, setViewingTxn] = useState<any | null>(null);
  const { currencySymbol } = useSettings();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [invoices, expenses, payments] = await Promise.all([
          api.get('/invoices'),
          api.get('/expenses'),
          api.get('/accounts/journal-entries'),
        ]);

        // Combine into unified transaction list
        const txns: any[] = [];

        invoices.forEach((inv: any) => {
          txns.push({
            id: `inv-${inv.id}`,
            date: inv.issue_date || inv.created_at,
            type: 'Invoice',
            description: `${inv.invoice_number} — ${inv.client_name}`,
            amount: parseFloat(inv.amount || 0),
            direction: 'in',
            status: inv.status,
          });
        });

        expenses.forEach((exp: any) => {
          txns.push({
            id: `exp-${exp.id}`,
            date: exp.date || exp.created_at,
            type: 'Expense',
            description: `${exp.category} — ${exp.description || ''}`,
            amount: parseFloat(exp.amount || 0),
            direction: 'out',
            status: exp.status,
          });
        });

        // Sort by date descending
        txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(txns);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const totalIn = transactions.filter(t => t.direction === 'in').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.direction === 'out').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Transactions</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-emerald-100 p-2 rounded-lg"><ArrowUpRight className="h-5 w-5 text-emerald-600" /></div><div><p className="text-xs text-slate-500">Money In</p><p className="text-xl font-bold text-emerald-600">{currencySymbol}{totalIn.toLocaleString(undefined, {minimumFractionDigits:2})}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-rose-100 p-2 rounded-lg"><ArrowDownRight className="h-5 w-5 text-rose-600" /></div><div><p className="text-xs text-slate-500">Money Out</p><p className="text-xl font-bold text-rose-600">{currencySymbol}{totalOut.toLocaleString(undefined, {minimumFractionDigits:2})}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-lg"><DollarSign className="h-5 w-5 text-indigo-600" /></div><div><p className="text-xs text-slate-500">Net</p><p className={`text-xl font-bold ${(totalIn - totalOut) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currencySymbol}{(totalIn - totalOut).toLocaleString(undefined, {minimumFractionDigits:2})}</p></div></div></Card>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader><CardTitle>All Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? (<TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Loading...</TableCell></TableRow>
                ) : transactions.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">No transactions.</TableCell></TableRow>
                ) : transactions.map(txn => (
                  <TableRow key={txn.id}>
                    <TableCell className="text-slate-500">{new Date(txn.date).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="outline" className={txn.direction === 'in' ? 'border-emerald-200 text-emerald-700' : 'border-rose-200 text-rose-700'}>{txn.type}</Badge></TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{txn.description}</TableCell>
                    <TableCell className={`font-bold ${txn.direction === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>{txn.direction === 'in' ? '+' : '-'}{currencySymbol}{txn.amount.toLocaleString(undefined, {minimumFractionDigits:2})}</TableCell>
                    <TableCell><Badge className={txn.status === 'paid' || txn.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : txn.status === 'overdue' || txn.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}>{txn.status}</Badge></TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => setViewingTxn(txn)} title="View Detail">
                         <Eye className="h-4 w-4 text-indigo-500" />
                       </Button>
                     </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* View Transaction Detail Modal */}
      <Dialog open={!!viewingTxn} onOpenChange={() => setViewingTxn(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900 font-bold">
              <DollarSign className="h-5 w-5 text-indigo-600" />
              Transaction Intelligence
            </DialogTitle>
          </DialogHeader>
          {viewingTxn && (
            <div className="space-y-6 py-4">
              <div className={`p-6 rounded-2xl shadow-xl border flex flex-col items-center ${viewingTxn.direction === 'in' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <div className={`p-3 rounded-full mb-3 shadow-sm ${viewingTxn.direction === 'in' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {viewingTxn.direction === 'in' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${viewingTxn.direction === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {viewingTxn.type} {viewingTxn.direction === 'in' ? 'Inflow' : 'Outflow'}
                </p>
                <h3 className={`text-4xl font-black ${viewingTxn.direction === 'in' ? 'text-emerald-900' : 'text-rose-900'}`}>
                  {viewingTxn.direction === 'in' ? '+' : '-'}{currencySymbol}{viewingTxn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>
              </div>

              <div className="space-y-4 px-1">
                <div className="flex items-center justify-between p-3 border rounded-xl bg-white shadow-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 max-w-[200px] truncate">{viewingTxn.description}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-xl bg-white shadow-sm flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</p>
                      <p className="text-sm font-bold text-slate-700">{new Date(viewingTxn.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                    </div>
                  </div>
                  <div className="p-3 border rounded-xl bg-white shadow-sm flex items-center gap-3">
                    <Hash className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Record ID</p>
                      <p className="text-sm font-bold text-slate-700 font-mono">{viewingTxn.id}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`h-5 w-5 ${viewingTxn.status === 'paid' || viewingTxn.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className="text-xs font-bold uppercase tracking-widest">Verification Status</span>
                  </div>
                  <Badge className={viewingTxn.status === 'paid' || viewingTxn.status === 'approved' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}>
                    {viewingTxn.status?.toUpperCase() || 'POSTED'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-tight font-medium">This transaction is a consolidated record derived from multiple ledgers. For detailed source modification, navigate to the specific module (Invoices, Expenses, etc.)</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingTxn(null)} className="w-full sm:w-auto font-bold">Dismiss Intelligence</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transactions;
