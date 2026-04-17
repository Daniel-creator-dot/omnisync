import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Plus, Trash2, Eye, Building2, Calendar, DollarSign, Info, ShieldCheck, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'sonner';

const FixedAssets = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<any | null>(null);
  const { currencySymbol } = useSettings();
  const [newAsset, setNewAsset] = useState({ name: '', category: '', purchaseDate: '', value: 0, depreciationRate: 0 });

  const fetchData = async () => {
    try { const data = await api.get('/assets'); setAssets(data); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/assets', { ...newAsset, value: Number(newAsset.value), depreciationRate: Number(newAsset.depreciationRate) }); toast.success('Asset added'); setIsAddOpen(false); setNewAsset({ name: '', category: '', purchaseDate: '', value: 0, depreciationRate: 0 }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteAsset = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/assets/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  return (
    <>
    <Card className="bg-white border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Fixed Assets</CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 gap-2" />}><Plus className="h-4 w-4" /> Add Asset</DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Name</Label><Input value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Category</Label><Input value={newAsset.category} onChange={e => setNewAsset({ ...newAsset, category: e.target.value })} /></div>
              <div className="space-y-2"><Label>Purchase Date</Label><Input type="date" value={newAsset.purchaseDate} onChange={e => setNewAsset({ ...newAsset, purchaseDate: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Value ({currencySymbol})</Label><Input type="number" value={newAsset.value} onChange={e => setNewAsset({ ...newAsset, value: Number(e.target.value) })} required /></div>
              <Button type="submit" className="w-full bg-indigo-600">Add Asset</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Asset</TableHead><TableHead>Category</TableHead><TableHead>Purchase Date</TableHead><TableHead>Value</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? (<TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : assets.length === 0 ? (<TableRow><TableCell colSpan={5} className="text-center py-10">No assets.</TableCell></TableRow>
            ) : (assets.map((a: any) => (
              <TableRow key={a.id}><TableCell className="font-medium">{a.name}</TableCell><TableCell>{a.category}</TableCell><TableCell>{a.purchase_date ? new Date(a.purchase_date).toLocaleDateString() : '-'}</TableCell><TableCell>{currencySymbol}{parseFloat(a.value).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setViewingAsset(a)} title="View Detail">
                      <Eye className="h-4 w-4 text-indigo-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteAsset(a.id)} className="text-red-500" title="Delete">
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
      {/* View Asset Detail Modal */ }
  <Dialog open={!!viewingAsset} onOpenChange={() => setViewingAsset(null)}>
    <DialogContent className="sm:max-w-[450px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-indigo-900 font-bold">
          <Building2 className="h-5 w-5 text-indigo-600" />
          Fixed Asset Profile
        </DialogTitle>
      </DialogHeader>
      {viewingAsset && (
        <div className="space-y-6 py-4">
          <div className="p-6 bg-indigo-950 text-white rounded-2xl shadow-xl">
            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-1">Acquisition Value</p>
            <h3 className="text-3xl font-black">{currencySymbol}{parseFloat(viewingAsset.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <div className="flex items-center gap-2 mt-4">
              <Tag className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">{viewingAsset.category || 'General Asset'}</span>
            </div>
          </div>

          <div className="space-y-5 px-1 font-medium">
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Identification</p>
                <p className="text-sm font-bold text-slate-700">{viewingAsset.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500"><Calendar className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Date</p>
                <p className="text-sm font-bold text-slate-700">{viewingAsset.purchase_date ? new Date(viewingAsset.purchase_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500"><DollarSign className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depreciation Rate</p>
                <p className="text-sm font-bold text-slate-700">{viewingAsset.depreciation_rate || 0}% Per Annum</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
              Fixed assets are subject to periodic physical verification. Disposal or transfer must be authorized by the financial controller.
            </p>
          </div>

          <div className="pt-2">
            <Button variant="outline" onClick={() => setViewingAsset(null)} className="w-full">Dismiss Detail</Button>
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
    </>
  );
};

export default FixedAssets;
