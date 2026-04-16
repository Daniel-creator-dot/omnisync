import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Landmark, CheckCircle2, AlertCircle, Eye, Info, Calendar, FileText, Hash, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { useSettings } from '../../contexts/SettingsContext';
import { useState } from 'react';

const BankReconciliation = () => {
  const [viewingEntry, setViewingEntry] = useState<any | null>(null);
  const { currencySymbol } = useSettings();

  // Mock data for demonstration since this is a UI-focused task
  const mockEntries = [
    { id: 1, date: '2024-05-10', description: 'Office Supplies - Amazon', reference: 'REF-9921', amount: -120.00, status: 'unreconciled' },
    { id: 2, date: '2024-05-11', description: 'Client Payment - Acme Corp', reference: 'INV-1002', amount: 5000.00, status: 'reconciled' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bank Reconciliation</h1>
        <Button className="bg-indigo-600 hover:bg-indigo-700">Import Statement</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border-slate-200">
          <p className="text-sm text-slate-500">Bank Balance</p>
          <p className="text-2xl font-bold text-slate-900">{currencySymbol}45,230.00</p>
        </Card>
        <Card className="p-6 bg-white border-slate-200">
          <p className="text-sm text-slate-500">Book Balance</p>
          <p className="text-2xl font-bold text-slate-900">{currencySymbol}44,850.00</p>
        </Card>
        <Card className="p-6 bg-white border-slate-200">
          <p className="text-sm text-slate-500">Difference</p>
          <p className="text-2xl font-bold text-rose-600">-{currencySymbol}380.00</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-indigo-500" />
            Unreconciled Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell className="font-medium text-slate-700">{entry.description}</TableCell>
                  <TableCell className="font-mono text-xs">{entry.reference}</TableCell>
                  <TableCell className={`text-right font-bold ${entry.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {entry.amount < 0 ? '-' : '+'}{currencySymbol}{Math.abs(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-center">
                    {entry.status === 'reconciled' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setViewingEntry(entry)} title="View Entry">
                      <Eye className="h-4 w-4 text-indigo-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Reconciliation Detail Modal */}
      <Dialog open={!!viewingEntry} onOpenChange={() => setViewingEntry(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900 font-bold">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Reconciliation Audit
            </DialogTitle>
          </DialogHeader>
          {viewingEntry && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-5 bg-slate-900 text-white rounded-2xl shadow-xl">
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Transaction Value</p>
                  <h3 className={`text-3xl font-black ${viewingEntry.amount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {viewingEntry.amount < 0 ? '-' : '+'}{currencySymbol}{Math.abs(viewingEntry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                </div>
                <Badge className={viewingEntry.status === 'reconciled' ? 'bg-emerald-500 text-white border-none' : 'bg-amber-500 text-white border-none'}>
                  {viewingEntry.status?.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-4 px-1">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 mt-1"><FileText className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                    <p className="text-sm font-bold text-slate-700 leading-tight mt-0.5">{viewingEntry.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Calendar className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Record Date</p>
                      <p className="text-sm font-bold text-slate-700">{viewingEntry.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Hash className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</p>
                      <p className="text-sm font-bold text-slate-700 font-mono">{viewingEntry.reference}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
                  <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[11px] text-indigo-700 leading-relaxed font-bold">
                      {viewingEntry.status === 'reconciled' 
                        ? 'This transaction matches exactly with bank record. Reconciliation is finalized and recorded in the audit trail.' 
                        : 'Action required. This transaction is present in the internal ledger but pending verification against the bank statement.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setViewingEntry(null)} className="flex-1 font-bold">Close</Button>
                {viewingEntry.status !== 'reconciled' && (
                  <Button className="flex-[2] bg-indigo-600 hover:bg-indigo-700 font-bold">Finalize Match</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankReconciliation;
