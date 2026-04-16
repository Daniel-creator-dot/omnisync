import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const Onboarding = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTask, setNewTask] = useState({ employeeId: '', task: '' });

  const fetchData = async () => {
    try { const [t, e] = await Promise.all([api.get('/onboarding-tasks'), api.get('/employees')]); setTasks(t); setEmployees(e); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/onboarding-tasks', newTask); toast.success('Task added'); setIsAddOpen(false); setNewTask({ employeeId: '', task: '' }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    try { await api.put(`/onboarding-tasks/${id}`, { completed: !completed }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/onboarding-tasks/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const getEmployeeName = (id: number) => employees.find(e => e.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Onboarding</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Add Task</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Onboarding Task</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Employee</Label>
                <Select onValueChange={(v: string) => setNewTask({...newTask, employeeId: v})} required>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{employees.map(emp => (<SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Task</Label><Input value={newTask.task} onChange={e => setNewTask({...newTask, task: e.target.value})} required /></div>
              <Button type="submit" className="w-full bg-indigo-600">Add Task</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader><CardTitle className="text-lg font-semibold">Onboarding Checklist</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-slate-500">Loading...</p> : tasks.length === 0 ? <p className="text-slate-500">No tasks.</p> : (
            <div className="space-y-3">{tasks.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleComplete(t.id, t.completed)}>
                  {t.completed ? <CheckSquare className="h-5 w-5 text-emerald-500" /> : <Square className="h-5 w-5 text-slate-300" />}
                  <div>
                    <p className={`font-medium ${t.completed ? 'line-through text-slate-400' : ''}`}>{t.task}</p>
                    <p className="text-xs text-slate-500">{getEmployeeName(t.employee_id)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={t.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{t.completed ? 'Done' : 'Pending'}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => deleteTask(t.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
