import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Plus, Trash2, ArrowRightLeft, Landmark, Wallet, Eye, Info, Calendar, Hash, DollarSign, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'sonner';

const Banking = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<any | null>(null);
  const [viewingTransfer, setViewingTransfer] = useState<any | null>(null);
  const { currencySymbol } = useSettings();
  const [newAccount, setNewAccount] = useState({ name: '', accountNumber: '', bankName: '', currency: 'USD', balance: 0 });
  const [transferForm, setTransferForm] = useState({ fromAccountId: '', toAccountId: '', amount: 0, description: '' });

  const fetchData = async () => {
    try {
      const [a, t] = await Promise.all([api.get('/banking/accounts'), api.get('/banking/transfers')]);
      setAccounts(a); setTransfers(t);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/banking/accounts', newAccount); toast.success('Account added'); setIsAddOpen(false); setNewAccount({ name: '', accountNumber: '', bankName: '', currency: 'USD', balance: 0 }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.fromAccountId === transferForm.toAccountId) { toast.error('Cannot transfer to the same account'); return; }
    try { await api.post('/banking/transfers', transferForm); toast.success('Transfer recorded'); setIsTransferOpen(false); setTransferForm({ fromAccountId: '', toAccountId: '', amount: 0, description: '' }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/banking/accounts/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Banking</h1>
        <div className="flex gap-2">
          <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
            <DialogTrigger render={<Button variant="outline" className="gap-2" />}><ArrowRightLeft className="h-4 w-4" /> Transfer</DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Bank Transfer</DialogTitle></DialogHeader>
              <form onSubmit={handleTransfer} className="space-y-4 pt-4">
                <div className="space-y-2"><Label>From</Label>
                  <Select onValueChange={(v: string) => setTransferForm({...transferForm, fromAccountId: v})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name} ({currencySymbol}{parseFloat(a.balance).toLocaleString()})</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>To</Label>
                  <Select onValueChange={(v: string) => setTransferForm({...transferForm, toAccountId: v})}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Amount ({currencySymbol})</Label><Input type="number" step="0.01" value={transferForm.amount} onChange={e => setTransferForm({...transferForm, amount: Number(e.target.value)})} required /></div>
                <div className="space-y-2"><Label>Description</Label><Input value={transferForm.description} onChange={e => setTransferForm({...transferForm, description: e.target.value})} /></div>
                <Button type="submit" className="w-full bg-indigo-600">Transfer</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Add Account</DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Bank Account</DialogTitle></DialogHeader>
              <form onSubmit={handleAddAccount} className="space-y-4 pt-4">
                <div className="space-y-2"><Label>Account Name</Label><Input value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} placeholder="Business Checking" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Account #</Label><Input value={newAccount.accountNumber} onChange={e => setNewAccount({...newAccount, accountNumber: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Bank</Label><Input value={newAccount.bankName} onChange={e => setNewAccount({...newAccount, bankName: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Currency</Label><Input value={newAccount.currency} onChange={e => setNewAccount({...newAccount, currency: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Opening Balance</Label><Input type="number" step="0.01" value={newAccount.balance} onChange={e => setNewAccount({...newAccount, balance: Number(e.target.value)})} /></div>
                </div>
                <Button type="submit" className="w-full bg-indigo-600">Add Account</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Total Balance */}
      <Card className="p-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-none">
        <div className="flex items-center gap-3"><Wallet className="h-8 w-8 opacity-80" /><div><p className="text-indigo-100 text-sm">Total Balance</p><p className="text-3xl font-bold">{currencySymbol}{totalBalance.toLocaleString(undefined, {minimumFractionDigits:2})}</p></div></div>
      </Card>

      {/* Bank Account Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="text-slate-500 col-span-full text-center py-10">Loading...</p> :
          accounts.length === 0 ? <p className="text-slate-500 col-span-full text-center py-10">No bank accounts. Add one to get started.</p> :
          accounts.map((a: any) => (
            <Card key={a.id} className="bg-white border-slate-200 hover:border-indigo-200 transition-colors">
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div className="flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-lg"><Landmark className="h-5 w-5 text-indigo-600" /></div><div><CardTitle className="text-base">{a.name}</CardTitle><p className="text-xs text-slate-500">{a.bank_name || 'Bank'} • {a.account_number ? `****${a.account_number.slice(-4)}` : ''}</p></div></div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="text-indigo-500 h-8 w-8" onClick={() => setViewingAccount(a)} title="View Detail"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-400 h-8 w-8" onClick={() => deleteAccount(a.id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold text-slate-900">{currencySymbol}{parseFloat(a.balance).toLocaleString(undefined, {minimumFractionDigits:2})}</p><Badge variant="outline" className="mt-2 text-[10px]">{a.currency || currencySymbol}</Badge></CardContent>
            </Card>
          ))}
      </div>

      {/* Transfers History */}
      {transfers.length > 0 && (
        <Card className="bg-white border-slate-200">
          <CardHeader><CardTitle className="text-lg">Recent Transfers</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>From → To</TableHead><TableHead>Amount</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>{transfers.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-slate-500">{t.date ? new Date(t.date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="font-medium">{accounts.find(a=>a.id===t.from_account_id)?.name || '?'} → {accounts.find(a=>a.id===t.to_account_id)?.name || '?'}</TableCell>
                    <TableCell className="font-bold">{currencySymbol}{parseFloat(t.amount).toLocaleString(undefined, {minimumFractionDigits:2})}</TableCell>
                    <TableCell className="text-slate-500">{t.description}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setViewingTransfer(t)} title="View Detail">
                        <Eye className="h-4 w-4 text-indigo-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {/* View Bank Account Detail Modal */}
      <Dialog open={!!viewingAccount} onOpenChange={() => setViewingAccount(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900 font-bold">
              <Landmark className="h-5 w-5 text-indigo-600" />
              Bank Account Portfolio
            </DialogTitle>
          </DialogHeader>
          {viewingAccount && (
            <div className="space-y-6 py-4 text-slate-700">
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-6 rounded-2xl shadow-xl text-white">
                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1">Available Liquidity</p>
                <h3 className="text-4xl font-black mb-2">{currencySymbol}{parseFloat(viewingAccount.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                <div className="flex items-center justify-between border-t border-indigo-700/50 pt-4 mt-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-indigo-300" />
                    <span className="text-xs font-mono">{viewingAccount.account_number || '•••• •••• •••• ••••'}</span>
                  </div>
                  <Badge className="bg-indigo-700 text-white border-none">{viewingAccount.currency}</Badge>
                </div>
              </div>

              <div className="space-y-5 px-1">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-2.5 rounded-xl"><Landmark className="h-5 w-5 text-slate-500" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institution Name</p>
                    <p className="text-sm font-bold">{viewingAccount.bank_name || 'Not Specified'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-2.5 rounded-xl"><Info className="h-5 w-5 text-slate-500" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Name</p>
                    <p className="text-sm font-bold">{viewingAccount.name}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Status</p>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  This account is verified and active for internal reconciliation. All transactions are logged with multi-party audit trails.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingAccount(null)} className="w-full sm:w-auto border-2 border-indigo-100">Dismiss View</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Transfer Detail Modal */}
      <Dialog open={!!viewingTransfer} onOpenChange={() => setViewingTransfer(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900">
              <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
              Transfer Confirmation
            </DialogTitle>
          </DialogHeader>
          {viewingTransfer && (
            <div className="space-y-6 py-4">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transferred Amount</p>
                <h3 className="text-3xl font-black text-indigo-900">{currencySymbol}{parseFloat(viewingTransfer.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                <Badge className="mt-3 bg-emerald-100 text-emerald-700 border-none px-3">COMPLETED</Badge>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between p-3 border rounded-xl bg-white">
                  <div className="flex items-center gap-3">
                    <ArrowRightLeft className="h-4 w-4 text-rose-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase">From</span>
                  </div>
                  <span className="text-sm font-bold">{accounts.find(a=>a.id===viewingTransfer.from_account_id)?.name || 'Source Account'}</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-xl bg-white">
                  <div className="flex items-center gap-3">
                    <ArrowRightLeft className="h-4 w-4 text-emerald-500 rotate-180" />
                    <span className="text-xs font-bold text-slate-500 uppercase">To</span>
                  </div>
                  <span className="text-sm font-bold">{accounts.find(a=>a.id===viewingTransfer.to_account_id)?.name || 'Destination Account'}</span>
                </div>
              </div>

              <div className="space-y-4 px-1">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Date</p>
                    <p className="text-sm font-bold">{new Date(viewingTransfer.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memorandum</p>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed italic mt-1">
                      "{viewingTransfer.description || 'No descriptive notes recorded for this transfer.'}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="outline" onClick={() => setViewingTransfer(null)} className="w-full">Close Confirmation</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Banking;
