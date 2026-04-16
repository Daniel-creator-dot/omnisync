import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Trash2, BookOpen, ArrowUpRight, ArrowDownRight, Eye, Calendar, FileText, Hash, Info, Landmark } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'sonner';

const GeneralLedger = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<any | null>(null);
  const { currencySymbol } = useSettings();
  const [newAccount, setNewAccount] = useState({ code: '', name: '', type: 'asset', balance: 0 });
  const [entryForm, setEntryForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', reference: '' });
  const [entryLines, setEntryLines] = useState<{ accountId: string; type: 'debit' | 'credit'; amount: number }[]>([
    { accountId: '', type: 'debit', amount: 0 },
    { accountId: '', type: 'credit', amount: 0 },
  ]);

  const fetchData = async () => {
    try {
      const [a, e] = await Promise.all([api.get('/accounts'), api.get('/accounts/journal-entries')]);
      setAccounts(a); setEntries(e);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/accounts', { ...newAccount, balance: Number(newAccount.balance) }); toast.success('Account added'); setIsAddAccountOpen(false); setNewAccount({ code: '', name: '', type: 'asset', balance: 0 }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const addEntryLine = () => setEntryLines([...entryLines, { accountId: '', type: 'debit', amount: 0 }]);
  const removeEntryLine = (i: number) => { if (entryLines.length > 2) setEntryLines(entryLines.filter((_, idx) => idx !== i)); };
  const updateEntryLine = (i: number, field: string, value: any) => {
    const updated = [...entryLines];
    (updated[i] as any)[field] = value;
    setEntryLines(updated);
  };

  const totalDebits = entryLines.filter(l => l.type === 'debit').reduce((s, l) => s + l.amount, 0);
  const totalCredits = entryLines.filter(l => l.type === 'credit').reduce((s, l) => s + l.amount, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) { toast.error('Debits must equal credits'); return; }
    try {
      await api.post('/accounts/journal-entries', {
        ...entryForm,
        lines: entryLines.map(l => ({ accountId: l.accountId, accountName: accounts.find(a => a.id.toString() === l.accountId)?.name || '', type: l.type, amount: l.amount })),
      });
      toast.success('Journal entry posted');
      setIsAddEntryOpen(false);
      setEntryForm({ date: new Date().toISOString().split('T')[0], description: '', reference: '' });
      setEntryLines([{ accountId: '', type: 'debit', amount: 0 }, { accountId: '', type: 'credit', amount: 0 }]);
      fetchData();
    } catch (error: any) { toast.error(error.message); }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/accounts/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  // Group accounts by type
  const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
  const groupedAccounts = accountTypes.map(type => ({
    type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
    accounts: accounts.filter(a => a.type === type),
    total: accounts.filter(a => a.type === type).reduce((s, a) => s + parseFloat(a.balance || 0), 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">General Ledger</h1>
        <div className="flex gap-2">
          <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
            <DialogTrigger render={<Button variant="outline" className="gap-2" />}><Plus className="h-4 w-4" /> Account</DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Account</DialogTitle></DialogHeader>
              <form onSubmit={handleAddAccount} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Code</Label><Input value={newAccount.code} onChange={e => setNewAccount({...newAccount, code: e.target.value})} placeholder="1000" required /></div>
                  <div className="space-y-2"><Label>Type</Label>
                    <Select value={newAccount.type} onValueChange={(v: string) => setNewAccount({...newAccount, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{accountTypes.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Name</Label><Input value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Opening Balance ({currencySymbol})</Label><Input type="number" step="0.01" value={newAccount.balance} onChange={e => setNewAccount({...newAccount, balance: Number(e.target.value)})} /></div>
                <Button type="submit" className="w-full bg-indigo-600">Add Account</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
            <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" />}><BookOpen className="h-4 w-4" /> Journal Entry</DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
              <form onSubmit={handleAddEntry} className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Date</Label><Input type="date" value={entryForm.date} onChange={e => setEntryForm({...entryForm, date: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>Reference</Label><Input value={entryForm.reference} onChange={e => setEntryForm({...entryForm, reference: e.target.value})} placeholder="JE-001" /></div>
                  <div className="space-y-2"><Label>Description</Label><Input value={entryForm.description} onChange={e => setEntryForm({...entryForm, description: e.target.value})} required /></div>
                </div>
                <div className="border rounded-lg overflow-x-auto min-h-[200px]">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead><tr className="bg-slate-50"><th className="p-2 text-left">Account</th><th className="p-2 text-center w-28">Type</th><th className="p-2 text-right w-28">Amount</th><th className="p-2 w-10"></th></tr></thead>
                    <tbody>
                      {entryLines.map((line, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">
                            <Select value={line.accountId} onValueChange={(v: string) => updateEntryLine(i, 'accountId', v)}>
                              <SelectTrigger className="h-8"><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className="p-2">
                            <Select value={line.type} onValueChange={(v: string) => updateEntryLine(i, 'type', v)}>
                              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="debit">Debit</SelectItem><SelectItem value="credit">Credit</SelectItem></SelectContent>
                            </Select>
                          </td>
                          <td className="p-2"><Input className="h-8 text-right" type="number" step="0.01" value={line.amount} onChange={e => updateEntryLine(i, 'amount', Number(e.target.value))} /></td>
                          <td className="p-2"><button type="button" onClick={() => removeEntryLine(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-2 border-t flex items-center justify-between">
                    <Button type="button" variant="ghost" size="sm" onClick={addEntryLine} className="text-indigo-600 gap-1"><Plus className="h-3 w-3" /> Add Line</Button>
                    <div className="flex gap-4 text-sm">
                      <span>Debits: <strong className="text-emerald-600">{currencySymbol}{totalDebits.toFixed(2)}</strong></span>
                      <span>Credits: <strong className="text-rose-600">{currencySymbol}{totalCredits.toFixed(2)}</strong></span>
                      {isBalanced ? <Badge className="bg-emerald-100 text-emerald-700">Balanced</Badge> : <Badge className="bg-rose-100 text-rose-700">Unbalanced</Badge>}
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-indigo-600" disabled={!isBalanced}>Post Journal Entry</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="chart" className="w-full">
        <TabsList><TabsTrigger value="chart">Chart of Accounts</TabsTrigger><TabsTrigger value="journal">Journal Entries</TabsTrigger></TabsList>

        <TabsContent value="chart" className="mt-6 space-y-4">
          {groupedAccounts.map(group => (
            <Card key={group.type} className="bg-white border-slate-200">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-slate-50 rounded-t-lg">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-600">{group.label}</CardTitle>
                <span className="text-sm font-bold">{currencySymbol}{group.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </CardHeader>
              {group.accounts.length > 0 && (
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {group.accounts.map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono text-slate-500 w-24">{a.code}</TableCell>
                          <TableCell className="font-medium">{a.name}</TableCell>
                          <TableCell className="text-right font-medium">{currencySymbol}{parseFloat(a.balance).toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                          <TableCell className="text-right w-12"><Button variant="ghost" size="icon" onClick={() => deleteAccount(a.id)} className="text-red-500 h-8 w-8"><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="journal" className="mt-6">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead>Description</TableHead><TableHead>Lines</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? (<TableRow><TableCell colSpan={4} className="text-center py-10">Loading...</TableCell></TableRow>
                  ) : entries.length === 0 ? (<TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">No journal entries.</TableCell></TableRow>
                  ) : entries.map((je: any) => {
                    const lines = typeof je.lines === 'string' ? JSON.parse(je.lines) : (je.lines || []);
                    return (
                      <TableRow key={je.id}>
                        <TableCell className="text-slate-500">{new Date(je.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-sm">{je.reference}</TableCell>
                        <TableCell className="font-medium">{je.description}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {lines.map((l: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                {l.type === 'debit' ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-rose-500" />}
                                <span className={l.type === 'credit' ? 'pl-4' : ''}>{l.accountName}</span>
                                <span className={`ml-auto font-mono ${l.type === 'debit' ? 'text-emerald-600' : 'text-rose-600'}`}>{currencySymbol}{parseFloat(l.amount).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setViewingEntry(je)} title="View Entry">
                            <Eye className="h-4 w-4 text-indigo-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* View Journal Entry Modal */}
      <Dialog open={!!viewingEntry} onOpenChange={() => setViewingEntry(null)}>
        <DialogContent className="sm:max-w-[600px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Journal Entry Detail
            </DialogTitle>
          </DialogHeader>
          {viewingEntry && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2.5 rounded-full shadow-sm">
                    <Hash className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{viewingEntry.reference || 'N/A'}</h3>
                    <p className="text-xs font-medium text-slate-500">Transaction ID: {viewingEntry.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction Date</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(viewingEntry.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase">Description</span>
                </div>
                <div className="p-3 bg-white border rounded-xl text-sm text-slate-700 font-medium">
                  {viewingEntry.description}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Landmark className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase">Ledger Postings</span>
                </div>
                <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-[10px] h-9">ACCOUNT</TableHead>
                        <TableHead className="text-[10px] h-9 text-right">DEBIT</TableHead>
                        <TableHead className="text-[10px] h-9 text-right">CREDIT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(typeof viewingEntry.lines === 'string' ? JSON.parse(viewingEntry.lines) : (viewingEntry.lines || [])).map((l: any, i: number) => (
                        <TableRow key={i} className="h-11">
                          <TableCell className="text-xs font-medium text-slate-700">
                            <div className="flex items-center gap-2">
                              {l.type === 'debit' ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-rose-500" />}
                              <span className={l.type === 'credit' ? 'pl-2' : ''}>{l.accountName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono font-bold text-emerald-600">
                            {l.type === 'debit' ? `${currencySymbol}${parseFloat(l.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono font-bold text-rose-600">
                            {l.type === 'credit' ? `${currencySymbol}${parseFloat(l.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="bg-slate-900 text-white p-3 flex justify-between items-center px-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Entry Value</span>
                    <span className="text-sm font-black text-emerald-400">
                      {currencySymbol}{(typeof viewingEntry.lines === 'string' ? JSON.parse(viewingEntry.lines) : (viewingEntry.lines || [])).filter((l:any) => l.type === 'debit').reduce((sum:number, l:any) => sum + parseFloat(l.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg text-blue-700 border border-blue-100">
                <Info className="h-4 w-4 shrink-0" />
                <p className="text-[11px] leading-tight">This transaction is balanced and finalized in the General Ledger. It cannot be modified directly once posted.</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingEntry(null)} className="w-full sm:w-auto">Close Entry</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeneralLedger;
