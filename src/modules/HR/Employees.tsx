import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Employee } from '../../types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Trash2, Edit, UserPlus, Eye, Mail, Phone, Briefcase, Calendar, Shield, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'sonner';

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { currencySymbol } = useSettings();
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '', email: '', phone: '', position: '', department: '', salary: 0,
    joinDate: new Date().toISOString().split('T')[0], status: 'active' as Employee['status'], role: 'employee'
  });

  const fetchEmployees = async () => {
    try {
      const data = await api.get('/employees');
      setEmployees(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, { ...newEmployee, salary: Number(newEmployee.salary) });
        toast.success('Employee updated');
      } else {
        await api.post('/employees', { ...newEmployee, salary: Number(newEmployee.salary) });
        toast.success('Employee added');
      }
      setIsAddOpen(false);
      setEditingEmployee(null);
      setNewEmployee({ name: '', email: '', phone: '', position: '', department: '', salary: 0, joinDate: new Date().toISOString().split('T')[0], status: 'active', role: 'employee' });
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.message || 'Failed');
    }
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setNewEmployee({ name: emp.name, email: emp.email, phone: (emp as any).phone || '', position: emp.position, department: emp.department, salary: emp.salary, joinDate: emp.joinDate || (emp as any).join_date, status: emp.status, role: 'employee' });
    setIsAddOpen(true);
  };

  const openAdd = () => {
    setEditingEmployee(null);
    setNewEmployee({ name: '', email: '', phone: '', position: '', department: '', salary: 0, joinDate: new Date().toISOString().split('T')[0], status: 'active', role: 'employee' });
    setIsAddOpen(true);
  };

  const deleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee record?')) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee deleted');
      fetchEmployees();
    } catch (error: any) { toast.error(error.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Employees</h1>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) { setEditingEmployee(null); setNewEmployee({ name: '', email: '', phone: '', position: '', department: '', salary: 0, joinDate: new Date().toISOString().split('T')[0], status: 'active', role: 'employee' }); }
        }}>
          <DialogTrigger render={<Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={openAdd} />}>
            <UserPlus className="h-4 w-4" /> Add Employee
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle></DialogHeader>
            <form onSubmit={handleAddEmployee} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} required />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" value={newEmployee.position} onChange={e => setNewEmployee({...newEmployee, position: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} placeholder="+123456789" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={newEmployee.department} onValueChange={(v: string) => setNewEmployee({...newEmployee, department: v})} required>
                  <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Annual Salary ({currencySymbol})</Label>
                <Input id="salary" type="number" value={newEmployee.salary} onChange={e => setNewEmployee({...newEmployee, salary: Number(e.target.value)})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input id="joinDate" type="date" value={newEmployee.joinDate} onChange={e => setNewEmployee({...newEmployee, joinDate: e.target.value})} required />
              </div>
              <div className="sm:col-span-1 space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={newEmployee.status} onValueChange={(v: any) => setNewEmployee({...newEmployee, status: v})} required>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-1 space-y-2">
                <Label htmlFor="role">Portal Access Role</Label>
                <Select value={newEmployee.role} onValueChange={(v: string) => setNewEmployee({...newEmployee, role: v})} required disabled={!!editingEmployee}>
                  <SelectTrigger><SelectValue placeholder="System Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="sm:col-span-2 bg-indigo-600 mt-2">
                {editingEmployee ? 'Update Employee' : 'Add Employee'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-slate-200 overflow-hidden">
        <CardHeader className="px-4 sm:px-6"><CardTitle className="text-lg font-semibold">Employee Directory</CardTitle></CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Employee</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="hidden lg:table-cell">Position</TableHead>
                  <TableHead className="hidden sm:table-cell">Join Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Loading employees...</TableCell></TableRow>
                ) : employees.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">No employees found.</TableCell></TableRow>
                ) : (
                  employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`} />
                            <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden">
                            <p className="font-medium truncate">{emp.name}</p>
                            <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{emp.department}</TableCell>
                      <TableCell className="hidden lg:table-cell">{emp.position}</TableCell>
                      <TableCell className="hidden sm:table-cell">{new Date((emp as any).join_date || emp.joinDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={emp.status === 'active' ? 'default' : 'secondary'} className={emp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                          {emp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setViewingEmployee(emp)} className="h-8 w-8 sm:h-9 sm:w-9" title="View Details">
                            <Eye className="h-4 w-4 text-indigo-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} className="h-8 w-8 sm:h-9 sm:w-9" title="Edit">
                            <Edit className="h-4 w-4 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteEmployee(emp.id)} className="h-8 w-8 sm:h-9 sm:w-9 text-red-500" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={!!viewingEmployee} onOpenChange={() => setViewingEmployee(null)}>
        <DialogContent className="sm:max-w-[600px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-indigo-600" />
              Employee Profile
            </DialogTitle>
          </DialogHeader>
          {viewingEmployee && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${viewingEmployee.name}`} />
                  <AvatarFallback>{viewingEmployee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{viewingEmployee.name}</h2>
                  <p className="text-sm font-medium text-indigo-600">{viewingEmployee.position}</p>
                  <Badge className="mt-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                    {viewingEmployee.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><Mail className="h-4 w-4 text-slate-500" /></div>
                    <div><p className="text-xs text-slate-500 uppercase font-semibold">Email Address</p><p className="text-sm font-medium">{viewingEmployee.email}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><Phone className="h-4 w-4 text-slate-500" /></div>
                    <div><p className="text-xs text-slate-500 uppercase font-semibold">Phone Number</p><p className="text-sm font-medium">{(viewingEmployee as any).phone || 'Not set'}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><Calendar className="h-4 w-4 text-slate-500" /></div>
                    <div><p className="text-xs text-slate-500 uppercase font-semibold">Join Date</p><p className="text-sm font-medium">{new Date((viewingEmployee as any).join_date || viewingEmployee.joinDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><Briefcase className="h-4 w-4 text-slate-500" /></div>
                    <div><p className="text-xs text-slate-500 uppercase font-semibold">Department</p><p className="text-sm font-medium">{viewingEmployee.department}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><DollarSign className="h-4 w-4 text-slate-500" /></div>
                    <div><p className="text-xs text-slate-500 uppercase font-semibold">Annual Salary</p><p className="text-sm font-medium">{currencySymbol}{viewingEmployee.salary.toLocaleString()}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><Shield className="h-4 w-4 text-slate-500" /></div>
                    <div><p className="text-xs text-slate-500 uppercase font-semibold">System Access Role</p><p className="text-sm font-medium capitalize">{(viewingEmployee as any).role || 'Employee'}</p></div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="outline" onClick={() => setViewingEmployee(null)}>Close Profile</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
