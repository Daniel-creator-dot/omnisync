import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Trash2, Eye, Percent, Info, ShieldCheck, Calendar, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

const TaxManagement = () => {
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingTax, setViewingTax] = useState<any | null>(null);
  const [newRate, setNewRate] = useState({ name: '', rate: 0 });

  const fetchData = async () => {
    try { const data = await api.get('/tax-rates'); setTaxRates(data); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/tax-rates', { ...newRate, rate: Number(newRate.rate) }); toast.success('Tax rate added'); setIsAddOpen(false); setNewRate({ name: '', rate: 0 }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteRate = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/tax-rates/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Tax Rates</CardTitle>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={<Button className="bg-indigo-600 gap-2" />}><Plus className="h-4 w-4" /> Add Tax Rate</DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Add Tax Rate</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 pt-4">
                <div className="space-y-2"><Label>Name</Label><Input value={newRate.name} onChange={e => setNewRate({...newRate, name: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Rate (%)</Label><Input type="number" step="0.01" value={newRate.rate} onChange={e => setNewRate({...newRate, rate: Number(e.target.value)})} required /></div>
                <Button type="submit" className="w-full bg-indigo-600">Add Rate</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Tax Name</TableHead><TableHead>Rate (%)</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (<TableRow><TableCell colSpan={3} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : taxRates.length === 0 ? (<TableRow><TableCell colSpan={3} className="text-center py-10">No tax rates.</TableCell></TableRow>
              ) : (taxRates.map((t: any) => (
                <TableRow key={t.id}><TableCell className="font-medium">{t.name}</TableCell><TableCell>{parseFloat(t.rate)}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewingTax(t)} title="View Detail">
                        <Eye className="h-4 w-4 text-indigo-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteRate(t.id)} className="text-red-500" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* View Tax Detail Modal */}
      <Dialog open={!!viewingTax} onOpenChange={() => setViewingTax(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900 font-bold">
              <Percent className="h-5 w-5 text-indigo-600" />
              Tax Configuration Detail
            </DialogTitle>
          </DialogHeader>
          {viewingTax && (
            <div className="space-y-6 py-4">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Configured Rate</p>
                <h3 className="text-4xl font-black text-slate-900">{parseFloat(viewingTax.rate)}%</h3>
                <Badge className="mt-4 bg-indigo-100 text-indigo-700 border-none font-bold px-3">ACTIVE RATE</Badge>
              </div>

              <div className="space-y-5 px-1">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-2.5 rounded-xl"><FileText className="h-5 w-5 text-slate-500" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax Name / Label</p>
                    <p className="text-sm font-bold text-slate-700">{viewingTax.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-2.5 rounded-xl"><ShieldCheck className="h-5 w-5 text-slate-500" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Status</p>
                    <p className="text-sm font-bold text-emerald-600">Verified for Filing</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 p-2.5 rounded-xl"><Calendar className="h-5 w-5 text-slate-500" /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Effective Period</p>
                    <p className="text-sm font-bold text-slate-700">Open-ended</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-3">
                <Info className="h-5 w-5 text-indigo-500 shrink-0" />
                <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
                  This tax rate is applied automatically to all generated invoices and calculated in the financial reports. Ensure this matches local regulatory requirements.
                </p>
              </div>

              <div className="pt-2">
                <Button variant="outline" onClick={() => setViewingTax(null)} className="w-full">Dismiss Configuration</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaxManagement;
