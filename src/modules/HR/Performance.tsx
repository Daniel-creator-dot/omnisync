import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Plus, Trash2, Star, Eye, User, Calendar, MessageSquare, Award } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const Performance = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingReview, setViewingReview] = useState<any | null>(null);
  const [newReview, setNewReview] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], rating: 3, comments: '' });

  const fetchData = async () => {
    try {
      const [r, e] = await Promise.all([api.get('/performance-reviews'), api.get('/employees')]);
      setReviews(r); setEmployees(e);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/performance-reviews', newReview); toast.success('Review added'); setIsAddOpen(false); setNewReview({ employeeId: '', date: new Date().toISOString().split('T')[0], rating: 3, comments: '' }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try { await api.delete(`/performance-reviews/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const getEmployeeName = (id: number) => employees.find(e => e.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Performance Reviews</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> New Review</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Performance Review</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Employee</Label>
                <Select onValueChange={(v: string) => setNewReview({...newReview, employeeId: v})} required>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{employees.map(emp => (<SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={newReview.date} onChange={e => setNewReview({...newReview, date: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Rating (1-5)</Label><Input type="number" min="1" max="5" value={newReview.rating} onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})} required /></div>
              <div className="space-y-2"><Label>Comments</Label><Input value={newReview.comments} onChange={e => setNewReview({...newReview, comments: e.target.value})} /></div>
              <Button type="submit" className="w-full bg-indigo-600">Submit Review</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader><CardTitle className="text-lg font-semibold">Review History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Rating</TableHead><TableHead>Comments</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (<TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">Loading...</TableCell></TableRow>
              ) : reviews.length === 0 ? (<TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">No reviews.</TableCell></TableRow>
              ) : (reviews.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{getEmployeeName(r.employee_id)}</TableCell>
                  <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                  <TableCell><div className="flex items-center gap-1">{Array.from({length: 5}).map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />))}</div></TableCell>
                  <TableCell className="max-w-xs truncate">{r.comments}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewingReview(r)} title="View Review">
                        <Eye className="h-4 w-4 text-indigo-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteReview(r.id)} className="text-red-500" title="Delete">
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
      {/* View Review Modal */}
      <Dialog open={!!viewingReview} onOpenChange={() => setViewingReview(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              Performance Review Detail
            </DialogTitle>
          </DialogHeader>
          {viewingReview && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full shadow-sm text-indigo-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{getEmployeeName(viewingReview.employee_id)}</h3>
                    <p className="text-xs font-medium text-slate-500">ID: {viewingReview.employee_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review Date</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(viewingReview.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                </div>
              </div>

              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Performance Rating</p>
                  <div className="flex items-center gap-2">
                    {Array.from({length: 5}).map((_, i) => (
                      <Star key={i} className={`h-8 w-8 ${i < viewingReview.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-100'}`} />
                    ))}
                  </div>
                  <p className="text-2xl font-black text-slate-900">{viewingReview.rating} / 5</p>
                  <Badge className={viewingReview.rating >= 4 ? 'bg-emerald-100 text-emerald-700' : viewingReview.rating >= 3 ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}>
                    {viewingReview.rating >= 4 ? 'EXCEPTIONAL' : viewingReview.rating >= 3 ? 'SATISFACTORY' : 'NEEDS IMPROVEMENT'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><Award className="h-4 w-4 text-slate-500" /></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Assessment</p>
                    <p className="text-sm font-medium">Standard Periodic Performance Evaluation</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><MessageSquare className="h-4 w-4 text-slate-500" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Reviewer Comments</p>
                    <div className="mt-1 text-sm text-slate-600 leading-relaxed border-l-2 border-indigo-200 pl-3 italic py-1 bg-slate-50/50 rounded-r-lg">
                      {viewingReview.comments || "No comments provided for this performance period."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingReview(null)} className="w-full sm:w-auto">Close Details</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Performance;
