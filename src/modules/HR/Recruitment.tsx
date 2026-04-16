import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Trash2, Eye, Briefcase, User, Info, Calendar, Mail, Phone, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const Recruitment = () => {
  const [postings, setPostings] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingPosting, setViewingPosting] = useState<any | null>(null);
  const [viewingCandidate, setViewingCandidate] = useState<any | null>(null);
  const [newPosting, setNewPosting] = useState({ title: '', department: '', description: '', status: 'open' });

  const fetchData = async () => {
    try {
      const [p, c] = await Promise.all([api.get('/recruitment/job-postings'), api.get('/recruitment/candidates')]);
      setPostings(p); setCandidates(c);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/recruitment/job-postings', newPosting); toast.success('Job posted'); setIsAddOpen(false); setNewPosting({ title: '', department: '', description: '', status: 'open' }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deletePosting = async (id: string) => {
    if (!confirm('Delete this posting?')) return;
    try { await api.delete(`/recruitment/job-postings/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Recruitment</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Post Job</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Job Posting</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Title</Label><Input value={newPosting.title} onChange={e => setNewPosting({...newPosting, title: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Department</Label>
                <Select onValueChange={(v: string) => setNewPosting({...newPosting, department: v})} required>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="Engineering">Engineering</SelectItem><SelectItem value="Sales">Sales</SelectItem><SelectItem value="HR">HR</SelectItem><SelectItem value="Finance">Finance</SelectItem><SelectItem value="Marketing">Marketing</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Description</Label><Input value={newPosting.description} onChange={e => setNewPosting({...newPosting, description: e.target.value})} /></div>
              <Button type="submit" className="w-full bg-indigo-600">Post Job</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader><CardTitle className="text-lg font-semibold">Open Positions</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-slate-500">Loading...</p> : postings.length === 0 ? <p className="text-slate-500">No postings.</p> : (
              <div className="space-y-3">{postings.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div><p className="font-medium">{p.title}</p><p className="text-xs text-slate-500">{p.department}</p></div>
                  <div className="flex items-center gap-1">
                    <Badge className={p.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>{p.status}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => setViewingPosting(p)} title="View Position"><Eye className="h-4 w-4 text-indigo-500" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deletePosting(p.id)} className="text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader><CardTitle className="text-lg font-semibold">Candidates ({candidates.length})</CardTitle></CardHeader>
          <CardContent>
            {candidates.length === 0 ? <p className="text-slate-500">No candidates.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>{candidates.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{c.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setViewingCandidate(c)} title="View Candidate">
                        <Eye className="h-4 w-4 text-indigo-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      {/* View Posting Modal */}
      <Dialog open={!!viewingPosting} onOpenChange={() => setViewingPosting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              Job Posting Details
            </DialogTitle>
          </DialogHeader>
          {viewingPosting && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="text-xl font-bold text-slate-900">{viewingPosting.title}</h3>
                <p className="text-sm font-medium text-indigo-600">{viewingPosting.department}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className={viewingPosting.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                    {viewingPosting.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-slate-400">Posted on: {new Date(viewingPosting.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Job Description</p>
                <div className="text-sm text-slate-600 leading-relaxed border rounded-lg p-3 bg-white">
                  {viewingPosting.description || 'No detailed description provided for this position.'}
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button variant="outline" onClick={() => setViewingPosting(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Candidate Modal */}
      <Dialog open={!!viewingCandidate} onOpenChange={() => setViewingCandidate(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              Candidate Profile
            </DialogTitle>
          </DialogHeader>
          {viewingCandidate && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="bg-white p-3 rounded-full shadow-sm text-indigo-600">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{viewingCandidate.name}</h3>
                  <Badge variant="secondary" className="mt-1 capitalize bg-indigo-50 text-indigo-700">
                    {viewingCandidate.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><Mail className="h-4 w-4 text-slate-500" /></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">Email Address</p><p className="text-sm font-medium">{viewingCandidate.email || 'N/A'}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><Phone className="h-4 w-4 text-slate-500" /></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">Phone Number</p><p className="text-sm font-medium">{viewingCandidate.phone || 'N/A'}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><FileText className="h-4 w-4 text-slate-500" /></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">Applied For</p><p className="text-sm font-medium">{viewingCandidate.job_title || 'General Application'}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-slate-100 p-1.5 rounded-lg"><Calendar className="h-4 w-4 text-slate-500" /></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">Application Date</p><p className="text-sm font-medium">{new Date(viewingCandidate.created_at || Date.now()).toLocaleDateString()}</p></div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setViewingCandidate(null)}>Close Profile</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700">Interview Candidate</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recruitment;
