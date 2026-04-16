import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

const Benefits = () => {
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newBenefit, setNewBenefit] = useState({ name: '', description: '', cost: 0 });

  const fetchData = async () => {
    try { const data = await api.get('/benefits'); setBenefits(data); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/benefits', { ...newBenefit, cost: Number(newBenefit.cost) }); toast.success('Benefit added'); setIsAddOpen(false); setNewBenefit({ name: '', description: '', cost: 0 }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteBenefit = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/benefits/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Benefits</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Add Benefit</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Benefit</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Name</Label><Input value={newBenefit.name} onChange={e => setNewBenefit({...newBenefit, name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={newBenefit.description} onChange={e => setNewBenefit({...newBenefit, description: e.target.value})} /></div>
              <div className="space-y-2"><Label>Monthly Cost ($)</Label><Input type="number" value={newBenefit.cost} onChange={e => setNewBenefit({...newBenefit, cost: Number(e.target.value)})} /></div>
              <Button type="submit" className="w-full bg-indigo-600">Add Benefit</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader><CardTitle className="text-lg font-semibold">Benefits Catalog</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Benefit</TableHead><TableHead>Description</TableHead><TableHead>Cost/mo</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (<TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">Loading...</TableCell></TableRow>
              ) : benefits.length === 0 ? (<TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">No benefits.</TableCell></TableRow>
              ) : (benefits.map((b: any) => (
                <TableRow key={b.id}><TableCell className="font-medium">{b.name}</TableCell><TableCell className="max-w-xs truncate">{b.description}</TableCell><TableCell>${parseFloat(b.cost).toLocaleString()}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteBenefit(b.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Benefits;
