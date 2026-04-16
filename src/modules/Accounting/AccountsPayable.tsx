import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Trash2, Truck, DollarSign, FileText, CheckCircle, Eye, Mail, Phone, MapPin, Calendar, Hash, Info, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'sonner';

const AccountsPayable = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [viewingVendor, setViewingVendor] = useState<any | null>(null);
  const [viewingBill, setViewingBill] = useState<any | null>(null);
  const { currencySymbol } = useSettings();
  const [newVendor, setNewVendor] = useState({ name: '', email: '', phone: '', address: '' });
  const [newBill, setNewBill] = useState({ vendorId: '', vendorName: '', amount: 0, dueDate: '', billNumber: '' });

  const fetchData = async () => {
    try { const [v, b] = await Promise.all([api.get('/contacts/vendors'), api.get('/contacts/bills')]); setVendors(v); setBills(b); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/contacts/vendors', newVendor); toast.success('Vendor added'); setIsAddVendorOpen(false); setNewVendor({ name: '', email: '', phone: '', address: '' }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/contacts/bills', newBill); toast.success('Bill added'); setIsAddBillOpen(false); setNewBill({ vendorId: '', vendorName: '', amount: 0, dueDate: '', billNumber: '' }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const markBillPaid = async (id: string) => {
    try { await api.put(`/contacts/bills/${id}`, { status: 'paid' }); toast.success('Marked as paid'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteVendor = async (id: string) => { if (!confirm('Delete?')) return; try { await api.delete(`/contacts/vendors/${id}`); toast.success('Deleted'); fetchData(); } catch (error: any) { toast.error(error.message); } };
  const deleteBill = async (id: string) => { if (!confirm('Delete?')) return; try { await api.delete(`/contacts/bills/${id}`); toast.success('Deleted'); fetchData(); } catch (error: any) { toast.error(error.message); } };

  const pendingTotal = bills.filter(b => b.status === 'pending').reduce((acc, b) => acc + parseFloat(b.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-lg"><Truck className="h-5 w-5 text-indigo-600" /></div><div><p className="text-xs text-slate-500">Total Vendors</p><p className="text-2xl font-bold">{vendors.length}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-rose-100 p-2 rounded-lg"><DollarSign className="h-5 w-5 text-rose-600" /></div><div><p className="text-xs text-slate-500">Outstanding Payables</p><p className="text-2xl font-bold text-rose-600">{currencySymbol}{pendingTotal.toLocaleString(undefined, {minimumFractionDigits:2})}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-amber-100 p-2 rounded-lg"><FileText className="h-5 w-5 text-amber-600" /></div><div><p className="text-xs text-slate-500">Open Bills</p><p className="text-2xl font-bold">{bills.filter(b => b.status === 'pending').length}</p></div></div></Card>
      </div>

      <Tabs defaultValue="vendors" className="w-full">
        <TabsList className="w-full max-w-xs"><TabsTrigger value="vendors" className="flex-1">Vendors</TabsTrigger><TabsTrigger value="bills" className="flex-1">Bills</TabsTrigger></TabsList>

        <TabsContent value="vendors" className="mt-6">
          <Card className="bg-white border-slate-200 overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Vendors</CardTitle>
              <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
                <DialogTrigger render={<Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Add Vendor</DialogTrigger>
                <DialogContent className="sm:max-w-[450px] w-[95vw]">
                  <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddVendor} className="space-y-4 pt-4">
                    <div className="space-y-2"><Label>Name</Label><Input value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Email</Label><Input type="email" value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Phone</Label><Input value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} /></div>
                    </div>
                    <div className="space-y-2"><Label>Address</Label><Input value={newVendor.address} onChange={e => setNewVendor({...newVendor, address: e.target.value})} /></div>
                    <Button type="submit" className="w-full bg-indigo-600">Add Vendor</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden md:table-cell">Email</TableHead><TableHead className="hidden sm:table-cell">Phone</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {loading ? <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">Loading...</TableCell></TableRow> :
                    vendors.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">No vendors.</TableCell></TableRow> :
                    vendors.map((v: any) => (
                      <TableRow key={v.id}>
                        <TableCell><div><p className="font-medium">{v.name}</p><p className="text-xs text-slate-400 md:hidden">{v.email}</p></div></TableCell>
                        <TableCell className="hidden md:table-cell">{v.email}</TableCell>
                        <TableCell className="hidden sm:table-cell">{v.phone}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewingVendor(v)} title="View Detail">
                              <Eye className="h-4 w-4 text-indigo-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteVendor(v.id)} className="text-red-500 h-8 w-8" title="Delete">
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
        </TabsContent>

        <TabsContent value="bills" className="mt-6">
          <Card className="bg-white border-slate-200 overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Bills</CardTitle>
              <Dialog open={isAddBillOpen} onOpenChange={setIsAddBillOpen}>
                <DialogTrigger render={<Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Add Bill</DialogTrigger>
                <DialogContent className="sm:max-w-[450px] w-[95vw]">
                  <DialogHeader><DialogTitle>Add Bill</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddBill} className="space-y-4 pt-4">
                    <div className="space-y-2"><Label>Vendor</Label>
                      <Select onValueChange={(v: string) => { const vendor = vendors.find(vn => vn.id.toString() === v); setNewBill({...newBill, vendorId: v, vendorName: vendor?.name || ''}); }}>
                        <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                        <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Bill #</Label><Input value={newBill.billNumber} onChange={e => setNewBill({...newBill, billNumber: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Amount ({currencySymbol})</Label><Input type="number" step="0.01" value={newBill.amount} onChange={e => setNewBill({...newBill, amount: Number(e.target.value)})} required /></div>
                    </div>
                    <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={newBill.dueDate} onChange={e => setNewBill({...newBill, dueDate: e.target.value})} required /></div>
                    <Button type="submit" className="w-full bg-indigo-600">Add Bill</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Amount</TableHead><TableHead className="hidden sm:table-cell">Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {bills.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">No bills.</TableCell></TableRow> :
                    bills.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.vendor_name}</TableCell>
                        <TableCell className="font-bold">{currencySymbol}{parseFloat(b.amount).toLocaleString(undefined, {minimumFractionDigits:2})}</TableCell>
                        <TableCell className="hidden sm:table-cell text-slate-500">{b.due_date ? new Date(b.due_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell><Badge className={b.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{b.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewingBill(b)} title="View Detail">
                              <Eye className="h-4 w-4 text-indigo-500" />
                            </Button>
                            {b.status === 'pending' && <Button variant="ghost" size="icon" onClick={() => markBillPaid(b.id)} className="text-emerald-500 h-8 w-8" title="Mark Paid"><CheckCircle className="h-4 w-4" /></Button>}
                            <Button variant="ghost" size="icon" onClick={() => deleteBill(b.id)} className="text-red-500 h-8 w-8" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* View Vendor Details Modal */}
      <Dialog open={!!viewingVendor} onOpenChange={() => setViewingVendor(null)}>
        <DialogContent className="sm:max-w-[500px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-600" />
              Vendor Profile
            </DialogTitle>
          </DialogHeader>
          {viewingVendor && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="bg-indigo-600 p-3 rounded-lg text-white shadow-md">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{viewingVendor.name}</h3>
                  <p className="text-xs font-semibold text-slate-500">Registered Partner</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Mail className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-medium text-slate-700">{viewingVendor.email || 'No email provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Phone className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                    <p className="text-sm font-medium text-slate-700">{viewingVendor.phone || 'No phone number'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><MapPin className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Address</p>
                    <p className="text-sm font-medium text-slate-700">{viewingVendor.address || 'No address recorded'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="outline" onClick={() => setViewingVendor(null)} className="w-full">Dismiss</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Bill Details Modal */}
      <Dialog open={!!viewingBill} onOpenChange={() => setViewingBill(null)}>
        <DialogContent className="sm:max-w-[500px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Payable Bill Detail
            </DialogTitle>
          </DialogHeader>
          {viewingBill && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-5 bg-indigo-950 text-white rounded-2xl shadow-xl">
                <div>
                  <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1">Total Payable</p>
                  <h3 className="text-3xl font-black">${parseFloat(viewingBill.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <Badge className={viewingBill.status === 'paid' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}>
                  {viewingBill.status?.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-xl bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{viewingBill.vendor_name}</p>
                </div>
                <div className="p-3 border rounded-xl bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill Number</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{viewingBill.bill_number || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Calendar className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</p>
                    <p className="text-sm font-medium text-slate-700">{new Date(viewingBill.due_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-slate-100 rounded-lg text-slate-500"><Info className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Notice</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium mt-1">
                      {viewingBill.status === 'paid' 
                        ? 'This bill was successfully settled and recorded in the financial system. No further action needed.' 
                        : 'This bill is currently outstanding. Please ensure payment is processed by the due date to avoid service interruptions or late fees.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setViewingBill(null)} className="flex-1">Close</Button>
                {viewingBill.status === 'pending' && (
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 flex-[2]"
                    onClick={() => { markBillPaid(viewingBill.id); setViewingBill(null); }}
                  >
                    Mark as Settled
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountsPayable;
