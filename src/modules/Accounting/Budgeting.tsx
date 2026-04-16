import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Plus, Trash2, Eye, BarChart3, PieChart, TrendingUp, Info, Calendar, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'sonner';

const Budgeting = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingBudget, setViewingBudget] = useState<any | null>(null);
  const { currencySymbol } = useSettings();
  const [newBudget, setNewBudget] = useState({ year: new Date().getFullYear(), category: '', amount: 0, actual: 0 });

  const fetchData = async () => {
    try { const data = await api.get('/budgets'); setBudgets(data); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/budgets', { ...newBudget, amount: Number(newBudget.amount), actual: Number(newBudget.actual) }); toast.success('Budget added'); setIsAddOpen(false); setNewBudget({ year: new Date().getFullYear(), category: '', amount: 0, actual: 0 }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteBudget = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/budgets/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Budget Management</CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 gap-2" />}><Plus className="h-4 w-4" /> Add Budget</DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Add Budget</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Year</Label><Input type="number" value={newBudget.year} onChange={e => setNewBudget({...newBudget, year: Number(e.target.value)})} required /></div>
              <div className="space-y-2"><Label>Category</Label><Input value={newBudget.category} onChange={e => setNewBudget({...newBudget, category: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Budget ({currencySymbol})</Label><Input type="number" value={newBudget.amount} onChange={e => setNewBudget({...newBudget, amount: Number(e.target.value)})} required /></div>
              <div className="space-y-2"><Label>Actual ({currencySymbol})</Label><Input type="number" value={newBudget.actual} onChange={e => setNewBudget({...newBudget, actual: Number(e.target.value)})} /></div>
              <Button type="submit" className="w-full bg-indigo-600">Add Budget</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Year</TableHead><TableHead>Category</TableHead><TableHead>Budget</TableHead><TableHead>Actual</TableHead><TableHead>Variance</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? (<TableRow><TableCell colSpan={6} className="text-center py-10">Loading...</TableCell></TableRow>
            ) : budgets.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center py-10">No budgets.</TableCell></TableRow>
            ) : (budgets.map((b: any) => {
              const variance = parseFloat(b.amount) - parseFloat(b.actual);
              return (
                <TableRow key={b.id}><TableCell>{b.year}</TableCell><TableCell className="font-medium">{b.category}</TableCell><TableCell>{currencySymbol}{parseFloat(b.amount).toLocaleString()}</TableCell><TableCell>{currencySymbol}{parseFloat(b.actual).toLocaleString()}</TableCell>
                  <TableCell className={variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{currencySymbol}{Math.abs(variance).toLocaleString()} {variance >= 0 ? 'under' : 'over'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewingBudget(b)} title="View Progress">
                        <Eye className="h-4 w-4 text-indigo-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteBudget(b.id)} className="text-red-500" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }))}
          </TableBody>
        </Table>
      </CardContent>
      {/* View Budget Detail Modal */}
      <Dialog open={!!viewingBudget} onOpenChange={() => setViewingBudget(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900 font-bold">
              <PieChart className="h-5 w-5 text-indigo-600" />
              Budget Analysis Detail
            </DialogTitle>
          </DialogHeader>
          {viewingBudget && (() => {
            const variance = parseFloat(viewingBudget.amount) - parseFloat(viewingBudget.actual);
            const percentUsed = Math.min(100, (parseFloat(viewingBudget.actual) / parseFloat(viewingBudget.amount)) * 100);
            return (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-5 bg-slate-900 text-white rounded-2xl shadow-xl">
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{viewingBudget.year} Allocation</p>
                  <h3 className="text-3xl font-black">{currencySymbol}{parseFloat(viewingBudget.amount).toLocaleString()}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Utilization</p>
                  <h3 className="text-2xl font-black text-indigo-400">{percentUsed.toFixed(1)}%</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-xl bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{viewingBudget.category}</p>
                </div>
                <div className="p-3 border rounded-xl bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fiscal Year</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{viewingBudget.year}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Usage Progress</span>
                    <span className="text-xs font-bold text-slate-700 font-mono">{currencySymbol}{parseFloat(viewingBudget.actual).toLocaleString()} / {currencySymbol}{parseFloat(viewingBudget.amount).toLocaleString()}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                    <div 
                      className={`h-full transition-all duration-500 ${percentUsed > 90 ? 'bg-rose-500' : percentUsed > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${percentUsed}%` }}
                    ></div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border flex items-start gap-3 ${variance >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                  <TrendingUp className={`h-5 w-5 shrink-0 ${variance >= 0 ? 'text-emerald-500' : 'text-rose-500 rotate-180'}`} />
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">Variance Analysis</p>
                    <p className="text-sm font-bold mt-0.5">
                      {variance >= 0 
                        ? `Under budget by ${currencySymbol}${variance.toLocaleString()}. Optimal spending maintained.` 
                        : `Over budget by ${currencySymbol}${Math.abs(variance).toLocaleString()}. Immediate review recommended.`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg text-slate-500 border border-slate-100">
                <Info className="h-4 w-4 shrink-0" />
                <p className="text-[10px] leading-tight font-medium">Budget values are updated in real-time based on approved expenses and general ledger postings for the specified period.</p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="outline" onClick={() => setViewingBudget(null)} className="w-full sm:w-auto font-bold">Dismiss Analysis</Button>
              </div>
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default Budgeting;
