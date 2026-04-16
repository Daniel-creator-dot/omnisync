import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  User, FileText, ShieldCheck, Mail, Briefcase, 
  Calendar, Clock, CreditCard, Plus, HelpCircle,
  CheckCircle2, AlertCircle, Timer, Printer, Eye, Target, LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const PayslipDocument = ({ pay, user }: { pay: any, user: any }) => {
  if (!pay || !user) return null;
  
  const monthName = new Date(pay.year, pay.month - 1).toLocaleString('default', { month: 'long' });
  
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-900">OMNISYNC</h2>
            <p className="text-sm text-slate-500">Official Salary Statement</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-semibold text-slate-800">Payslip</h3>
            <p className="text-sm font-medium text-slate-500">
              Period: {monthName} {pay.year}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div>
          <p className="text-xs uppercase text-slate-400 font-semibold">Employee Details</p>
          <p className="font-bold text-slate-900 text-lg mt-1">{user.displayName}</p>
          <p className="text-slate-600 text-sm">{user.email}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-slate-400 font-semibold">Role & Department</p>
          <p className="font-bold text-slate-900 mt-1 capitalize">{user.role}</p>
          <p className="text-slate-600 text-sm">{user.department || 'General'}</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-slate-200">
          <div className="p-0">
            <h4 className="bg-slate-100 p-3 text-sm font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wide">Earnings</h4>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Base Salary</span>
                <span className="font-medium text-slate-900">${parseFloat(pay.base_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Bonuses / Allowances</span>
                <span className="font-medium text-emerald-600">+${parseFloat(pay.bonuses).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          <div className="p-0">
            <h4 className="bg-slate-100 p-3 text-sm font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wide">Deductions</h4>
            <div className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax / Standard Deductions</span>
                <span className="font-medium text-rose-600">-${parseFloat(pay.deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <span className="font-bold text-lg uppercase tracking-wider text-slate-300">Net Pay Transfer</span>
          <span className="font-bold text-2xl tracking-tight text-white">${parseFloat(pay.net_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      
      <div className="pt-12 text-center text-xs text-slate-400">
        <p>This is a computer-generated document. No signature is required.</p>
        <p>Generated on {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

const SelfService = () => {
  const { profile } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [exitRequests, setExitRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Leave Form State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: 'vacation',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Payslip Print State
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [me, leave, payroll, timesheets, perf, exit] = await Promise.all([
        api.get('/auth/me'),
        api.get('/leave-requests').catch(() => []),
        api.get('/payroll').catch(() => []),
        api.get('/timesheets').catch(() => []),
        api.get('/performance-reviews').catch(() => []),
        api.get('/exit-management').catch(() => [])
      ]);
      setUserData(me);
      setLeaveRequests(leave);
      setPayrollHistory(payroll);
      setAttendance(timesheets);
      setPerformance(perf);
      setExitRequests(exit);
    } catch (error) {
      console.error('Failed to fetch self-service data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/leave-requests', leaveForm);
      toast.success('Leave request submitted successfully');
      setIsLeaveModalOpen(false);
      setLeaveForm({ type: 'vacation', startDate: '', endDate: '', reason: '' });
      fetchData(); // Refresh list
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    }
  };

  const openPayslip = (pay: any) => {
    setSelectedPayslip(pay);
    setIsPayslipModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'paid':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> {status}</span>;
      case 'pending':
      case 'submitted':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Timer className="h-3 w-3" /> {status}</span>;
      case 'rejected':
      case 'cancelled':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700"><AlertCircle className="h-3 w-3" /> {status}</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const displayUser = userData || profile;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* 
        PRINT ONLY VIEW 
        This div is visually hidden on screen but becomes block during window.print().
        It acts as the root print element.
      */}
      <div className="hidden print:block absolute inset-0 bg-white z-[99999] p-10 min-h-screen">
        {selectedPayslip && <PayslipDocument pay={selectedPayslip} user={displayUser} />}
      </div>

      {/* NORMAL SYSTEM UI (HIDDEN DURING PRINT) */}
      <div className="space-y-8 animate-in fade-in duration-500 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Employee Portal</h1>
          <p className="text-slate-500">Manage your profile, leave, and payments in one place.</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white p-1 border border-slate-200">
            <TabsTrigger value="overview" className="gap-2"><User className="h-4 w-4" /> Overview</TabsTrigger>
            <TabsTrigger value="leave" className="gap-2"><Calendar className="h-4 w-4" /> Leave</TabsTrigger>
            <TabsTrigger value="payroll" className="gap-2"><CreditCard className="h-4 w-4" /> Payroll</TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2"><Clock className="h-4 w-4" /> Attendance</TabsTrigger>
            <TabsTrigger value="performance" className="gap-2"><Target className="h-4 w-4" /> Performance</TabsTrigger>
            <TabsTrigger value="exit" className="gap-2"><LogOut className="h-4 w-4" /> Exit Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-xl">Personal Profile</CardTitle>
                  <CardDescription>Verify your details and department info.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Full Name</p>
                    <p className="text-slate-900 font-semibold text-lg">{displayUser?.displayName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Email Address</p>
                    <p className="text-slate-900 font-semibold flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />{displayUser?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Department</p>
                    <p className="text-indigo-600 font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4" />{displayUser?.department || 'General'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Role</p>
                    <p className="text-slate-900 font-medium capitalize">{displayUser?.role}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" /> Help & Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-indigo-100 mb-4 text-sm leading-relaxed">
                      Have questions about your benefits or need to update your info? Our HR team is here to help.
                    </p>
                    <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-bold">Contact Support</Button>
                  </CardContent>
                </Card>
                
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Policy Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start gap-3 h-10"><FileText className="h-4 w-4 text-slate-400" /> Employee Handbook</Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 h-10"><ShieldCheck className="h-4 w-4 text-slate-400" /> Benefits Overview</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leave">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">My Leave Requests</CardTitle>
                  <CardDescription>View your history and submit new requests.</CardDescription>
                </div>
                <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
                  <DialogTrigger
                    render={
                      <Button className="bg-indigo-600 gap-2">
                        <Plus className="h-4 w-4" /> New Request
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader><DialogTitle>Submit Leave Request</DialogTitle></DialogHeader>
                    <form onSubmit={handleLeaveSubmit} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Leave Type</Label>
                        <Select value={leaveForm.type} onValueChange={(v) => setLeaveForm({...leaveForm, type: v})}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vacation">Vacation</SelectItem>
                            <SelectItem value="sick">Sick Leave</SelectItem>
                            <SelectItem value="personal">Personal Leave</SelectItem>
                            <SelectItem value="maternity">Maternity/Paternity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Reason / Notes</Label>
                        <Textarea value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} required />
                      </div>
                      <Button type="submit" className="w-full bg-indigo-600">Submit Request</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">No leave requests found.</TableCell></TableRow>
                    ) : (
                      leaveRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium capitalize">{req.type}</TableCell>
                          <TableCell>{new Date(req.start_date).toLocaleDateString()} to {new Date(req.end_date).toLocaleDateString()}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{req.reason}</TableCell>
                          <TableCell className="text-right">{getStatusBadge(req.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll">
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl">My Payslips</CardTitle>
                <CardDescription>Processed payments and history.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Adjustments</TableHead>
                      <TableHead>Net Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollHistory.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">No payment history found.</TableCell></TableRow>
                    ) : (
                      payrollHistory.map((pay) => (
                        <TableRow key={pay.id}>
                          <TableCell className="font-semibold">{pay.month}/{pay.year}</TableCell>
                          <TableCell>${parseFloat(pay.base_salary).toLocaleString()}</TableCell>
                          <TableCell className="text-emerald-600">
                            +${(parseFloat(pay.bonuses) - parseFloat(pay.deductions)).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-bold font-mono">${parseFloat(pay.net_salary).toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(pay.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => openPayslip(pay)} className="gap-2">
                              <Eye className="h-4 w-4" /> View Payslip
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl">Recent Attendance</CardTitle>
                <CardDescription>Daily clock-in and clock-out logs.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours Logged</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-10 text-slate-500">No attendance logs found.</TableCell></TableRow>
                    ) : (
                      attendance.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</TableCell>
                          <TableCell>{entry.hours} hours</TableCell>
                          <TableCell className="text-right">{getStatusBadge(entry.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl">Performance Reviews</CardTitle>
                <CardDescription>Your regular performance ratings and feedback.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Eval Date</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performance.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-500">No performance reviews found.</TableCell></TableRow>
                    ) : (
                      performance.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell className="font-medium">{new Date(review.review_date).toLocaleDateString()}</TableCell>
                          <TableCell>{review.reviewer_name}</TableCell>
                          <TableCell><strong className="text-indigo-600">{review.rating}</strong> / 5</TableCell>
                          <TableCell className="truncate max-w-[200px]">{review.comments || review.feedback}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exit">
            <Card className="shadow-sm border-slate-200 border-rose-100">
              <CardHeader className="bg-rose-50/50">
                <CardTitle className="text-xl text-rose-900">Exit Management</CardTitle>
                <CardDescription className="text-rose-700/70">Initiate resignation or view offboarding tasks.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {exitRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <LogOut className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Considering leaving the team?</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">
                      If you've made the decision to resign, you can initiate the process here. We'll assist you with a smooth transition.
                    </p>
                    <Button variant="destructive">Initiate Resignation</Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Last Working Day</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exitRequests.map((exit) => (
                        <TableRow key={exit.id}>
                          <TableCell className="font-medium capitalize">{exit.type}</TableCell>
                          <TableCell>{new Date(exit.last_working_day || exit.date).toLocaleDateString()}</TableCell>
                          <TableCell className="truncate max-w-[200px]">{exit.reason}</TableCell>
                          <TableCell className="text-right">{getStatusBadge(exit.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payslip View Dialog */}
        <Dialog open={isPayslipModalOpen} onOpenChange={setIsPayslipModalOpen}>
          <DialogContent className="sm:max-w-[650px] w-[95vw] p-0 overflow-hidden print:hidden border-0 shadow-2xl">
            <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between sticky top-0 z-10">
              <DialogTitle className="text-xl">Salary & Payslip Detail</DialogTitle>
              <Button onClick={() => window.print()} className="bg-slate-900 text-white hover:bg-slate-800 gap-2">
                <Printer className="h-4 w-4" /> Print Document
              </Button>
            </DialogHeader>
            <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar bg-white">
              <PayslipDocument pay={selectedPayslip} user={displayUser} />
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
};

export default SelfService;

