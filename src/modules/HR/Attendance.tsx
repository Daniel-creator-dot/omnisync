import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Trash2, CheckCircle, Eye, Clock, Calendar, User, Info, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const Attendance = () => {
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<any | null>(null);
  const [newEntry, setNewEntry] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], hours: 8 });

  const fetchData = async () => {
    try { const [t, e] = await Promise.all([api.get('/timesheets'), api.get('/employees')]); setTimesheets(t); setEmployees(e); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/timesheets', newEntry); toast.success('Entry added'); setIsAddOpen(false); setNewEntry({ employeeId: '', date: new Date().toISOString().split('T')[0], hours: 8 }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const approveEntry = async (id: string) => {
    try { await api.put(`/timesheets/${id}`, { status: 'approved' }); toast.success('Approved'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/timesheets/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const getEmployeeName = (id: number) => employees.find(e => e.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Attendance</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Log Time</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Timesheet</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Employee</Label>
                <Select onValueChange={(v: string) => setNewEntry({...newEntry, employeeId: v})} required>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{employees.map(emp => (<SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Hours</Label><Input type="number" value={newEntry.hours} onChange={e => setNewEntry({...newEntry, hours: Number(e.target.value)})} required /></div>
              <Button type="submit" className="w-full bg-indigo-600">Log Entry</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader><CardTitle className="text-lg font-semibold">Timesheet Records</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Hours</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (<TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">Loading...</TableCell></TableRow>
              ) : timesheets.length === 0 ? (<TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">No records.</TableCell></TableRow>
              ) : (timesheets.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{getEmployeeName(t.employee_id)}</TableCell>
                  <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell>{t.hours}</TableCell>
                  <TableCell><Badge variant="secondary" className={t.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{t.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewingEntry(t)} title="View Detail">
                        <Eye className="h-4 w-4 text-indigo-500" />
                      </Button>
                      {t.status === 'submitted' && <Button variant="ghost" size="icon" onClick={() => approveEntry(t.id)} className="text-emerald-500" title="Approve"><CheckCircle className="h-4 w-4" /></Button>}
                      <Button variant="ghost" size="icon" onClick={() => deleteEntry(t.id)} className="text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* View Attendance Detail Modal */}
      <Dialog open={!!viewingEntry} onOpenChange={() => setViewingEntry(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              Attendance Record Detail
            </DialogTitle>
          </DialogHeader>
          {viewingEntry && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full shadow-sm text-indigo-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{getEmployeeName(viewingEntry.employee_id)}</h3>
                    <p className="text-xs font-medium text-slate-500">Employee ID: {viewingEntry.employee_id}</p>
                  </div>
                </div>
                <Badge className={viewingEntry.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                  {viewingEntry.status?.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-xl bg-white shadow-sm flex flex-col items-center">
                  <Calendar className="h-5 w-5 text-slate-400 mb-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Date</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(viewingEntry.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                </div>
                <div className="p-4 border rounded-xl bg-indigo-600 shadow-md flex flex-col items-center text-white">
                  <Clock className="h-5 w-5 text-indigo-200 mb-2" />
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Logged Hours</p>
                  <p className="text-2xl font-black">{viewingEntry.hours}h</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><Info className="h-4 w-4 text-slate-500" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Entry Method</p>
                    <p className="text-sm font-medium">Standard Web Portal Check-in</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><FileText className="h-4 w-4 text-slate-500" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Verification Audit</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {viewingEntry.status === 'approved' 
                        ? 'Successfully verified by department manager. This record has been finalized for payroll processing.' 
                        : 'Awaiting managerial authorization. Hours are currently unverified but logged in the system.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="outline" onClick={() => setViewingEntry(null)} className="flex-1">Close</Button>
                {viewingEntry.status === 'submitted' && (
                  <Button className="bg-indigo-600 hover:bg-indigo-700 flex-1" onClick={() => { approveEntry(viewingEntry.id); setViewingEntry(null); }}>
                    Approve Entry
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

export default Attendance;
