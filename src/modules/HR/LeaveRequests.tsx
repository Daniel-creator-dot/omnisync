import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { LeaveRequest } from '../../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, CheckCircle, XCircle, Trash2, Edit, Eye, Calendar, User, FileText, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const LeaveRequests = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);
  const [newRequest, setNewRequest] = useState({ 
    type: 'vacation' as string, 
    startDate: '', 
    endDate: '', 
    reason: '', 
    status: 'pending' as string,
    employeeId: '' as string 
  });

  const canManage = profile?.role === 'admin' || profile?.role === 'hr';

  const fetchData = async () => {
    try { 
      const [reqData, empData] = await Promise.all([
        api.get('/leave-requests'),
        canManage ? api.get('/employees') : Promise.resolve([])
      ]); 
      setRequests(reqData); 
      setEmployees(empData);
    }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRequest) {
        await api.put(`/leave-requests/${editingRequest.id}`, newRequest);
        toast.success('Request updated');
      } else {
        await api.post('/leave-requests', newRequest);
        toast.success('Leave requested');
      }
      setIsAddOpen(false); setEditingRequest(null);
      setNewRequest({ type: 'vacation', startDate: '', endDate: '', reason: '', status: 'pending', employeeId: '' });
      fetchData();
    } catch (error: any) { toast.error(error.message); }
  };

  const openEdit = (req: any) => {
    setEditingRequest(req);
    setNewRequest({ 
      type: req.type, 
      startDate: req.start_date?.split('T')[0] || req.startDate, 
      endDate: req.end_date?.split('T')[0] || req.endDate, 
      reason: req.reason, 
      status: req.status,
      employeeId: req.employee_id?.toString() || ''
    });
    setIsAddOpen(true);
  };

  const updateStatus = async (id: string, status: string) => {
    try { await api.put(`/leave-requests/${id}`, { status }); toast.success(`Request ${status}`); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('Delete this request?')) return;
    try { await api.delete(`/leave-requests/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leave Requests</h1>
        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) { setEditingRequest(null); setNewRequest({ type: 'vacation', startDate: '', endDate: '', reason: '', status: 'pending', employeeId: '' }); } }}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" />}>
            <Plus className="h-4 w-4" /> Request Leave
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingRequest ? 'Edit Leave Request' : 'Request Leave'}</DialogTitle></DialogHeader>
            <form onSubmit={handleAddRequest} className="space-y-4 pt-4">
              {canManage && !editingRequest && (
                <div className="space-y-2">
                  <Label>Assign to Employee (Optional)</Label>
                  <Select value={newRequest.employeeId} onValueChange={(v: string) => setNewRequest({...newRequest, employeeId: v})}>
                    <SelectTrigger><SelectValue placeholder="Myself" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Myself</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Admins can file leave on behalf of other staff.</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Select value={newRequest.type} onValueChange={(v: string) => setNewRequest({...newRequest, type: v})} required>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="personal">Personal Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={newRequest.startDate} onChange={e => setNewRequest({...newRequest, startDate: e.target.value})} required /></div>
                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={newRequest.endDate} onChange={e => setNewRequest({...newRequest, endDate: e.target.value})} required /></div>
              </div>
              <div className="space-y-2"><Label>Reason</Label><Input value={newRequest.reason} onChange={e => setNewRequest({...newRequest, reason: e.target.value})} /></div>
              <Button type="submit" className="w-full bg-indigo-600">{editingRequest ? 'Update Request' : 'Submit Request'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader><CardTitle className="text-lg font-semibold">Requests Overview</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (<TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">Loading...</TableCell></TableRow>
              ) : requests.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">No requests found.</TableCell></TableRow>
              ) : (requests.map((req: any) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.employee_name}</TableCell>
                  <TableCell className="capitalize">{req.type}</TableCell>
                  <TableCell><div className="text-xs">{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</div></TableCell>
                  <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}>{req.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setViewingRequest(req)} title="View Details"><Eye className="h-4 w-4 text-indigo-500" /></Button>
                      {req.status === 'pending' && <Button variant="ghost" size="icon" onClick={() => openEdit(req)} title="Edit"><Edit className="h-4 w-4 text-slate-400" /></Button>}
                      {canManage && req.status === 'pending' && (<>
                        <Button variant="ghost" size="icon" onClick={() => updateStatus(req.id, 'approved')} className="text-emerald-500" title="Approve"><CheckCircle className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => updateStatus(req.id, 'rejected')} className="text-rose-500" title="Reject"><XCircle className="h-4 w-4" /></Button>
                      </>)}
                      <Button variant="ghost" size="icon" onClick={() => deleteRequest(req.id)} className="text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* View Request Details Dialog */}
      <Dialog open={!!viewingRequest} onOpenChange={() => setViewingRequest(null)}>
        <DialogContent className="sm:max-w-[500px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-indigo-600" />
              Leave Request Details
            </DialogTitle>
          </DialogHeader>
          {viewingRequest && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full shadow-sm">
                    <User className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{viewingRequest.employee_name}</h2>
                    <p className="text-xs font-medium text-slate-500">Employee ID: {viewingRequest.employee_id}</p>
                  </div>
                </div>
                <Badge className={viewingRequest.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : viewingRequest.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}>
                  {viewingRequest.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Type</span>
                  </div>
                  <p className="text-sm font-semibold capitalize">{viewingRequest.type}</p>
                </div>
                <div className="p-3 border rounded-lg bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</span>
                  </div>
                  <p className="text-sm font-semibold">
                    {Math.ceil((new Date(viewingRequest.end_date).getTime() - new Date(viewingRequest.start_date).getTime()) / (1000 * 3600 * 24)) + 1} Days
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><Calendar className="h-4 w-4 text-slate-500" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Leave Period</p>
                    <p className="text-sm font-medium">
                      {new Date(viewingRequest.start_date).toLocaleDateString(undefined, { dateStyle: 'medium' })} to {new Date(viewingRequest.end_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><Info className="h-4 w-4 text-slate-500" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Reason for Leave</p>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                      "{viewingRequest.reason || 'No reason provided.'}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setViewingRequest(null)} className="flex-1 sm:flex-none">Close</Button>
                {canManage && viewingRequest.status === 'pending' && (
                  <div className="flex gap-2 flex-grow sm:flex-grow-0">
                    <Button 
                      variant="outline" 
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 flex-1 sm:flex-none"
                      onClick={() => { updateStatus(viewingRequest.id, 'rejected'); setViewingRequest(null); }}
                    >
                      Reject
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none"
                      onClick={() => { updateStatus(viewingRequest.id, 'approved'); setViewingRequest(null); }}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveRequests;
