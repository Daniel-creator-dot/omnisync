import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Trash2, UserMinus, CheckCircle, XCircle, FileText, DollarSign, Clock, ClipboardCheck, Eye, Info, User, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const ExitManagement = () => {
  const [exits, setExits] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [detailExit, setDetailExit] = useState<any>(null);
  const [viewingExit, setViewingExit] = useState<any | null>(null);
  const [newExit, setNewExit] = useState({ employeeId: '', exitType: 'resignation', exitDate: new Date().toISOString().split('T')[0], lastWorkingDay: '', noticePeriod: 30, reason: '' });

  const fetchData = async () => {
    try {
      const [e, emp] = await Promise.all([api.get('/exit-management'), api.get('/employees')]);
      setExits(e); setEmployees(emp);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((em: any) => em.id.toString() === newExit.employeeId);
    if (!emp) { toast.error('Select an employee'); return; }
    try {
      await api.post('/exit-management', {
        ...newExit, employeeName: emp.name, department: emp.department, position: emp.position
      });
      toast.success('Exit process initiated');
      setIsAddOpen(false);
      setNewExit({ employeeId: '', exitType: 'resignation', exitDate: new Date().toISOString().split('T')[0], lastWorkingDay: '', noticePeriod: 30, reason: '' });
      fetchData();
    } catch (error: any) { toast.error(error.message); }
  };

  const updateExit = async (id: number, updates: any) => {
    try { 
      await api.put(`/exit-management/${id}`, updates); 
      toast.success('Updated'); 
      fetchData(); 
      if (detailExit?.id === id) { setDetailExit({ ...detailExit, ...updates }); }
      if (viewingExit?.id === id) { setViewingExit({ ...viewingExit, ...updates }); }
    }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteExit = async (id: number) => {
    if (!confirm('Delete this exit record?')) return;
    try { await api.delete(`/exit-management/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const statusColors: Record<string, string> = {
    initiated: 'bg-blue-100 text-blue-700', in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-slate-100 text-slate-700'
  };

  const exitTypeLabels: Record<string, string> = {
    resignation: 'Resignation', termination: 'Termination', retirement: 'Retirement',
    layoff: 'Layoff', mutual: 'Mutual Separation', contract_end: 'Contract End'
  };

  const initiated = exits.filter(e => e.status === 'initiated').length;
  const inProgress = exits.filter(e => e.status === 'in_progress').length;
  const completed = exits.filter(e => e.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Exit Management</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Initiate Exit</DialogTrigger>
          <DialogContent className="sm:max-w-[500px] w-[95vw]">
            <DialogHeader><DialogTitle>Initiate Employee Exit</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Employee</Label>
                <Select onValueChange={(v: string) => setNewExit({...newExit, employeeId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{employees.filter(e => e.status === 'active').map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name} — {e.department}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Exit Type</Label>
                  <Select value={newExit.exitType} onValueChange={(v: string) => setNewExit({...newExit, exitType: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(exitTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Notice Period (days)</Label><Input type="number" value={newExit.noticePeriod} onChange={e => setNewExit({...newExit, noticePeriod: Number(e.target.value)})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Exit Date</Label><Input type="date" value={newExit.exitDate} onChange={e => setNewExit({...newExit, exitDate: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Last Working Day</Label><Input type="date" value={newExit.lastWorkingDay} onChange={e => setNewExit({...newExit, lastWorkingDay: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>Reason</Label><Input value={newExit.reason} onChange={e => setNewExit({...newExit, reason: e.target.value})} placeholder="Reason for exit..." /></div>
              <Button type="submit" className="w-full bg-indigo-600">Initiate Exit</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-blue-100 p-2 rounded-lg"><Clock className="h-5 w-5 text-blue-600" /></div><div><p className="text-xs text-slate-500">Initiated</p><p className="text-2xl font-bold text-blue-600">{initiated}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-amber-100 p-2 rounded-lg"><ClipboardCheck className="h-5 w-5 text-amber-600" /></div><div><p className="text-xs text-slate-500">In Progress</p><p className="text-2xl font-bold text-amber-600">{inProgress}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-emerald-100 p-2 rounded-lg"><CheckCircle className="h-5 w-5 text-emerald-600" /></div><div><p className="text-xs text-slate-500">Completed</p><p className="text-2xl font-bold text-emerald-600">{completed}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-slate-100 p-2 rounded-lg"><UserMinus className="h-5 w-5 text-slate-600" /></div><div><p className="text-xs text-slate-500">Total Exits</p><p className="text-2xl font-bold">{exits.length}</p></div></div></Card>
      </div>

      {/* Detail Panel */}
      {detailExit && (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardHeader className="flex flex-row items-start justify-between">
            <div><CardTitle className="text-lg">{detailExit.employee_name} — Exit Checklist</CardTitle>
              <p className="text-sm text-slate-500">{detailExit.department} • {exitTypeLabels[detailExit.exit_type] || detailExit.exit_type}</p></div>
            <Button variant="ghost" size="sm" onClick={() => setDetailExit(null)}>✕</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Exit Interview */}
              <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${detailExit.exit_interview_done ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                onClick={() => updateExit(detailExit.id, { exitInterviewDone: !detailExit.exit_interview_done })}>
                <div className="flex items-center gap-2 mb-2">{detailExit.exit_interview_done ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-slate-300" />}<span className="font-medium text-sm">Exit Interview</span></div>
                <p className="text-xs text-slate-500">{detailExit.exit_interview_done ? 'Completed' : 'Pending'}</p>
              </div>
              {/* Assets Returned */}
              <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${detailExit.assets_returned ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                onClick={() => updateExit(detailExit.id, { assetsReturned: !detailExit.assets_returned })}>
                <div className="flex items-center gap-2 mb-2">{detailExit.assets_returned ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-slate-300" />}<span className="font-medium text-sm">Assets Returned</span></div>
                <p className="text-xs text-slate-500">{detailExit.assets_returned ? 'All returned' : 'Pending return'}</p>
              </div>
              {/* Settlement */}
              <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${detailExit.final_settlement_paid ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                onClick={() => updateExit(detailExit.id, { finalSettlementPaid: !detailExit.final_settlement_paid })}>
                <div className="flex items-center gap-2 mb-2">{detailExit.final_settlement_paid ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-slate-300" />}<span className="font-medium text-sm">Final Settlement</span></div>
                <p className="text-xs text-slate-500">{detailExit.final_settlement_paid ? 'Paid' : 'Pending'}</p>
              </div>
              {/* Status */}
              <div className="p-4 rounded-lg border-2 border-slate-200 bg-white">
                <p className="font-medium text-sm mb-2">Status</p>
                <Select value={detailExit.status} onValueChange={(v: string) => { updateExit(detailExit.id, { status: v }); setDetailExit({...detailExit, status: v}); }}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="initiated">Initiated</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exit Records Table */}
      <Card className="bg-white border-slate-200 overflow-hidden">
        <CardHeader><CardTitle>Exit Records</CardTitle></CardHeader>
        <CardContent className="p-0"><div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Employee</TableHead><TableHead className="hidden sm:table-cell">Department</TableHead><TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Exit Date</TableHead><TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Interview</TableHead><TableHead className="hidden lg:table-cell">Assets</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-500">Loading...</TableCell></TableRow> :
              exits.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-500">No exit records.</TableCell></TableRow> :
              exits.map((ex: any) => (
                <TableRow key={ex.id} className="cursor-pointer hover:bg-indigo-50/50" onClick={() => setDetailExit(ex)}>
                  <TableCell><div><p className="font-medium">{ex.employee_name}</p><p className="text-xs text-slate-400 sm:hidden">{ex.department}</p></div></TableCell>
                  <TableCell className="hidden sm:table-cell text-slate-500">{ex.department}</TableCell>
                  <TableCell><Badge variant="outline">{exitTypeLabels[ex.exit_type] || ex.exit_type}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell text-slate-500">{ex.exit_date ? new Date(ex.exit_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell><Badge className={statusColors[ex.status] || 'bg-slate-100'}>{ex.status?.replace('_', ' ')}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell">{ex.exit_interview_done ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-slate-300" />}</TableCell>
                  <TableCell className="hidden lg:table-cell">{ex.assets_returned ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-slate-300" />}</TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="text-indigo-500 h-8 w-8" onClick={() => setViewingExit(ex)} title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => deleteExit(ex.id)} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div></CardContent>
      </Card>
      {/* View Exit Details Modal */}
      <Dialog open={!!viewingExit} onOpenChange={() => setViewingExit(null)}>
        <DialogContent className="sm:max-w-[600px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-indigo-600" />
              Exit Process Detail
            </DialogTitle>
          </DialogHeader>
          {viewingExit && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full shadow-sm text-indigo-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{viewingExit.employee_name}</h3>
                    <p className="text-xs font-medium text-slate-500">{viewingExit.department} • {viewingExit.position}</p>
                  </div>
                </div>
                <Badge className={statusColors[viewingExit.status] || 'bg-slate-100'}>
                  {viewingExit.status?.toUpperCase().replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-xl bg-white shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Exit Type</p>
                  <p className="text-sm font-bold text-slate-700">{exitTypeLabels[viewingExit.exit_type] || viewingExit.exit_type}</p>
                </div>
                <div className="p-3 border rounded-xl bg-white shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Exit Date</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(viewingExit.exit_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Offboarding Checklist</p>
                <div className="grid grid-cols-1 gap-3">
                  <div className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${viewingExit.exit_interview_done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-indigo-200'}`}
                    onClick={() => updateExit(viewingExit.id, { exitInterviewDone: !viewingExit.exit_interview_done })}>
                    <div className="flex items-center gap-3">
                      {viewingExit.exit_interview_done ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <Clock className="h-5 w-5 text-slate-300" />}
                      <span className="text-sm font-semibold">Exit Interview</span>
                    </div>
                    {viewingExit.exit_interview_done && <Badge className="bg-emerald-500 text-white border-none">DONE</Badge>}
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${viewingExit.assets_returned ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-indigo-200'}`}
                    onClick={() => updateExit(viewingExit.id, { assetsReturned: !viewingExit.assets_returned })}>
                    <div className="flex items-center gap-3">
                      {viewingExit.assets_returned ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <ShieldCheck className="h-5 w-5 text-slate-300" />}
                      <span className="text-sm font-semibold">Asset Clearance</span>
                    </div>
                    {viewingExit.assets_returned && <Badge className="bg-emerald-500 text-white border-none">DONE</Badge>}
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${viewingExit.final_settlement_paid ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-indigo-200'}`}
                    onClick={() => updateExit(viewingExit.id, { finalSettlementPaid: !viewingExit.final_settlement_paid })}>
                    <div className="flex items-center gap-3">
                      {viewingExit.final_settlement_paid ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <DollarSign className="h-5 w-5 text-slate-300" />}
                      <span className="text-sm font-semibold">Final Settlement</span>
                    </div>
                    {viewingExit.final_settlement_paid && <Badge className="bg-emerald-500 text-white border-none">PAID</Badge>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes / Reason</Label>
                <div className="text-sm text-slate-600 border rounded-lg p-3 bg-slate-50 italic">
                  "{viewingExit.reason || 'No specific reason provided for this exit.'}"
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-400">STATUS:</p>
                  <Select value={viewingExit.status} onValueChange={(v: string) => updateExit(viewingExit.id, { status: v })}>
                    <SelectTrigger className="h-8 w-32 border-none bg-white font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="initiated">Initiated</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={() => setViewingExit(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExitManagement;
