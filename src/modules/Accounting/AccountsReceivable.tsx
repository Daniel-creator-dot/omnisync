import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Trash2, Users as UsersIcon, DollarSign, FileText, Eye, Mail, Phone, MapPin, Building2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'sonner';

const AccountsReceivable = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);
  const { currencySymbol } = useSettings();
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', company: '', address: '', city: '', state: '', zip: '' });

  const fetchData = async () => {
    try { const [c, i] = await Promise.all([api.get('/contacts/customers'), api.get('/invoices')]); setCustomers(c); setInvoices(i); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/contacts/customers', newCustomer); toast.success('Customer added'); setIsAddOpen(false); setNewCustomer({ name: '', email: '', phone: '', company: '', address: '', city: '', state: '', zip: '' }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try { await api.delete(`/contacts/customers/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const pendingTotal = invoices.filter(i => i.status === 'pending' || i.status === 'partial').reduce((acc, i) => acc + parseFloat(i.balance_due || i.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-lg"><UsersIcon className="h-5 w-5 text-indigo-600" /></div><div><p className="text-xs text-slate-500">Total Customers</p><p className="text-2xl font-bold">{customers.length}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-amber-100 p-2 rounded-lg"><DollarSign className="h-5 w-5 text-amber-600" /></div><div><p className="text-xs text-slate-500">Outstanding Receivables</p><p className="text-2xl font-bold text-amber-600">{currencySymbol}{pendingTotal.toLocaleString(undefined, {minimumFractionDigits:2})}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-violet-100 p-2 rounded-lg"><FileText className="h-5 w-5 text-violet-600" /></div><div><p className="text-xs text-slate-500">Open Invoices</p><p className="text-2xl font-bold">{invoices.filter(i => i.status !== 'paid').length}</p></div></div></Card>
      </div>

      <Card className="bg-white border-slate-200 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Customers</CardTitle>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Add Customer</DialogTrigger>
            <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name</Label><Input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>Company</Label><Input value={newCustomer.company} onChange={e => setNewCustomer({...newCustomer, company: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>Address</Label><Input value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>City</Label><Input value={newCustomer.city} onChange={e => setNewCustomer({...newCustomer, city: e.target.value})} /></div>
                  <div className="space-y-2"><Label>State</Label><Input value={newCustomer.state} onChange={e => setNewCustomer({...newCustomer, state: e.target.value})} /></div>
                  <div className="space-y-2"><Label>ZIP</Label><Input value={newCustomer.zip} onChange={e => setNewCustomer({...newCustomer, zip: e.target.value})} /></div>
                </div>
                <Button type="submit" className="w-full bg-indigo-600">Add Customer</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Company</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead><TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? (<TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">Loading...</TableCell></TableRow>
                ) : customers.length === 0 ? (<TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">No customers yet.</TableCell></TableRow>
                ) : customers.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell><div><p className="font-medium">{c.name}</p><p className="text-xs text-slate-400 sm:hidden">{c.company || c.email}</p></div></TableCell>
                    <TableCell className="hidden sm:table-cell">{c.company || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">{c.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{c.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingCustomer(c)} title="View Profile">
                          <Eye className="h-4 w-4 text-indigo-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCustomer(c.id)} className="text-red-500 h-8 w-8" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* View Customer Details Modal */}
      <Dialog open={!!viewingCustomer} onOpenChange={() => setViewingCustomer(null)}>
        <DialogContent className="sm:max-w-[500px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900 font-bold">
              <UsersIcon className="h-5 w-5 text-indigo-600" />
              Customer Master Profile
            </DialogTitle>
          </DialogHeader>
          {viewingCustomer && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 shadow-sm text-indigo-900">
                <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black leading-tight tracking-tight">{viewingCustomer.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                    <p className="text-sm font-bold text-indigo-500">{viewingCustomer.company || 'Private Individual'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Mail className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                      <p className="text-sm font-bold text-slate-700">{viewingCustomer.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Phone className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                      <p className="text-sm font-bold text-slate-700">{viewingCustomer.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mt-1"><MapPin className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered Address</p>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-sm font-bold text-slate-700">{viewingCustomer.address || 'No address specified'}</p>
                      {(viewingCustomer.city || viewingCustomer.state) && (
                        <p className="text-sm font-bold text-slate-500">{viewingCustomer.city}, {viewingCustomer.state} {viewingCustomer.zip}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl text-white">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Revenue Contribution</span>
                    </div>
                    <span className="text-lg font-black text-emerald-400">CALCULATING...</span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center mt-2 font-medium tracking-tight">Financial historical data is synchronized in real-time from the Invoice Ledger.</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingCustomer(null)} className="w-full font-bold border-2 border-indigo-50">Dismiss Dossier</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountsReceivable;
