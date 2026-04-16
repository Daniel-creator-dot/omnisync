import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Users, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Employee {
  id: number; name: string; position: string; department: string; email: string;
  manager_id: number | null; status: string;
}

const OrgNode = ({ employee, subordinates, allEmployees, level, onAssignManager }: {
  employee: Employee; subordinates: Employee[]; allEmployees: Employee[];
  level: number; onAssignManager: (empId: number, managerId: number | null) => void;
}) => {
  const [expanded, setExpanded] = useState(level < 2);
  const directReports = subordinates.filter(e => e.manager_id === employee.id);
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  const color = colors[level % colors.length];

  return (
    <div className="flex flex-col items-center">
      <div className={`relative bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow p-4 min-w-[200px] max-w-[260px] ${level === 0 ? 'border-indigo-300 shadow-indigo-100' : ''}`}>
        <div className="flex items-center gap-3">
          <div className={`${color} rounded-full w-10 h-10 flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm text-slate-900 truncate">{employee.name}</p>
            <p className="text-xs text-slate-500 truncate">{employee.position || employee.department}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Badge variant="outline" className="text-[10px]">{employee.department}</Badge>
          {directReports.length > 0 && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          )}
        </div>
        {directReports.length > 0 && <p className="text-[10px] text-slate-400 mt-1">{directReports.length} direct report{directReports.length > 1 ? 's' : ''}</p>}
      </div>

      {expanded && directReports.length > 0 && (
        <>
          <div className="w-px h-6 bg-slate-300"></div>
          <div className="relative">
            {directReports.length > 1 && <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-slate-300" style={{ width: `${Math.min(directReports.length - 1, 4) * 240}px` }}></div>}
            <div className="flex gap-4 flex-wrap justify-center">
              {directReports.map(sub => (
                <div key={sub.id} className="flex flex-col items-center">
                  <div className="w-px h-6 bg-slate-300"></div>
                  <OrgNode employee={sub} subordinates={allEmployees} allEmployees={allEmployees} level={level + 1} onAssignManager={onAssignManager} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Organogram = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedManager, setSelectedManager] = useState<string>('');

  const fetchData = async () => {
    try { const data = await api.get('/employees'); setEmployees(data); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const assignManager = async (empId: number, managerId: number | null) => {
    try {
      await api.put(`/employees/${empId}`, { managerId });
      toast.success('Manager assigned');
      fetchData();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleAssign = async () => {
    if (!selectedEmployee) return;
    const managerId = selectedManager === 'none' ? null : parseInt(selectedManager);
    await assignManager(parseInt(selectedEmployee), managerId);
    setSelectedEmployee('');
    setSelectedManager('');
  };

  const activeEmployees = employees.filter(e => e.status === 'active');
  const topLevel = activeEmployees.filter(e => !e.manager_id);
  const departments = [...new Set(activeEmployees.map(e => e.department).filter(Boolean))];
  const deptCounts = departments.map(d => ({ name: d, count: activeEmployees.filter(e => e.department === d).length }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Organogram</h1>
        {isAdmin && (
          <Button variant="outline" className="gap-2" onClick={() => setEditMode(!editMode)}>
            <Users className="h-4 w-4" /> {editMode ? 'View Chart' : 'Edit Reporting'}
          </Button>
        )}
      </div>

      {/* Department summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {deptCounts.map(d => (
          <Card key={d.name} className="p-3">
            <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-indigo-500" /><div><p className="text-xs text-slate-500">{d.name}</p><p className="text-lg font-bold">{d.count}</p></div></div>
          </Card>
        ))}
      </div>

      {editMode ? (
        <Card>
          <CardHeader><CardTitle>Assign Reporting Structure</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500">Select an employee and assign their manager to build the org chart.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{activeEmployees.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name} — {e.position}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reports To</label>
                <Select value={selectedManager} onValueChange={setSelectedManager}>
                  <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No Manager (Top Level) —</SelectItem>
                    {activeEmployees.filter(e => e.id.toString() !== selectedEmployee).map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name} — {e.position}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAssign} className="bg-indigo-600 hover:bg-indigo-700" disabled={!selectedEmployee || !selectedManager}>Assign</Button>
            </div>

            {/* Current Structure Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="py-2 text-left font-medium text-slate-500">Employee</th><th className="py-2 text-left font-medium text-slate-500">Position</th><th className="py-2 text-left font-medium text-slate-500">Reports To</th></tr></thead>
                <tbody>
                  {activeEmployees.map(e => {
                    const manager = activeEmployees.find(m => m.id === e.manager_id);
                    return (<tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="py-2 font-medium">{e.name}</td><td className="py-2 text-slate-500">{e.position}</td><td className="py-2">{manager ? <Badge variant="outline">{manager.name}</Badge> : <span className="text-slate-400">—</span>}</td></tr>);
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-6 overflow-x-auto">
          <div className="flex justify-center min-w-[600px]">
            {topLevel.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No reporting structure defined yet.</p>
                <p className="text-sm text-slate-400 mt-1">Click "Edit Reporting" to assign managers and build the org chart.</p>
              </div>
            ) : (
              <div className="flex gap-8 flex-wrap justify-center">
                {topLevel.map(emp => (
                  <OrgNode key={emp.id} employee={emp} subordinates={activeEmployees} allEmployees={activeEmployees} level={0} onAssignManager={assignManager} />
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Organogram;
