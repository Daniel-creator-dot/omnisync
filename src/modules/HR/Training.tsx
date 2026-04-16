import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Plus, Trash2, Eye, BookOpen, Clock, Building, Award, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

const Training = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingCourse, setViewingCourse] = useState<any | null>(null);
  const [newCourse, setNewCourse] = useState({ title: '', provider: '', duration: '' });

  const fetchData = async () => {
    try { const data = await api.get('/training-courses'); setCourses(data); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/training-courses', newCourse); toast.success('Course added'); setIsAddOpen(false); setNewCourse({ title: '', provider: '', duration: '' }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    try { await api.delete(`/training-courses/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Training</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Add Course</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Training Course</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Title</Label><Input value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Provider</Label><Input value={newCourse.provider} onChange={e => setNewCourse({...newCourse, provider: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Duration</Label><Input value={newCourse.duration} onChange={e => setNewCourse({...newCourse, duration: e.target.value})} placeholder="e.g. 20 hours" required /></div>
              <Button type="submit" className="w-full bg-indigo-600">Add Course</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader><CardTitle className="text-lg font-semibold">Training Catalog</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Course</TableHead><TableHead>Provider</TableHead><TableHead>Duration</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (<TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">Loading...</TableCell></TableRow>
              ) : courses.length === 0 ? (<TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">No courses.</TableCell></TableRow>
              ) : (courses.map((c: any) => (
                <TableRow key={c.id}><TableCell className="font-medium">{c.title}</TableCell><TableCell>{c.provider}</TableCell><TableCell>{c.duration}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewingCourse(c)} title="View Course">
                        <Eye className="h-4 w-4 text-indigo-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteCourse(c.id)} className="text-red-500" title="Delete">
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
      {/* View Course Details Modal */}
      <Dialog open={!!viewingCourse} onOpenChange={() => setViewingCourse(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Course Curriculum Details
            </DialogTitle>
          </DialogHeader>
          {viewingCourse && (
            <div className="space-y-6 py-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                  <BookOpen className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{viewingCourse.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
                    <Building className="h-3 w-3" />
                    {viewingCourse.provider}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-xl bg-white shadow-sm flex items-center gap-3">
                  <div className="bg-amber-50 p-2 rounded-lg"><Clock className="h-4 w-4 text-amber-600" /></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</p><p className="text-sm font-bold text-slate-700">{viewingCourse.duration}</p></div>
                </div>
                <div className="p-3 border rounded-xl bg-white shadow-sm flex items-center gap-3">
                  <div className="bg-emerald-50 p-2 rounded-lg"><Award className="h-4 w-4 text-emerald-600" /></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p><p className="text-sm font-bold text-slate-700">Available</p></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 bg-slate-100 p-2 rounded-lg"><Building className="h-4 w-4 text-slate-500" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Training Provider</p>
                    <p className="text-sm font-medium text-slate-900">{viewingCourse.provider}</p>
                    <p className="text-xs text-slate-400 mt-0.5 italic">Official institutional certification partner</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-0.5 bg-slate-100 p-2 rounded-lg"><Info className="h-4 w-4 text-slate-500" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Course Syllabus</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded border border-dashed border-slate-200">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        Comprehensive module identification
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded border border-dashed border-slate-200">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        Practical skills assessment protocols
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded border border-dashed border-slate-200">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        Final certification and performance review
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingCourse(null)} className="w-full sm:w-auto">Close Curriculum</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Training;
