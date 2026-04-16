import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { FileBarChart, Download, Printer, Users, CheckSquare } from 'lucide-react';
import { Button } from "../../components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { api } from '../../lib/api';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

const HRReports = () => {
  const [stats, setStats] = useState<any>({ activeEmployees: 0, activePostings: 0, departmentDistribution: [] });
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [pendingAttendanceCount, setPendingAttendanceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, leaveData, attendanceData] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/leave-requests'),
          api.get('/timesheets')
        ]);
        setStats(statsData);
        setPendingLeaveCount(leaveData.filter((r: any) => r.status === 'pending').length);
        setPendingAttendanceCount(attendanceData.filter((t: any) => t.status === 'submitted').length);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const headcountData = stats.departmentDistribution?.length > 0
    ? stats.departmentDistribution.map((d: any) => ({ name: d.name, value: d.count }))
    : [{ name: 'No data', value: 0 }];

  const reports = [
    { title: 'Headcount Report', description: 'Current employee count by department and position.' },
    { title: 'Turnover Analysis', description: 'Employee retention and attrition rates.' },
    { title: 'Payroll Summary', description: 'Total payroll costs and breakdown.' },
    { title: 'Leave Balance Report', description: 'Accrued and used leave days for all employees.' },
    { title: 'Performance Distribution', description: 'Analysis of performance ratings across the company.' },
    { title: 'Recruitment Funnel', description: 'Candidate conversion rates from application to offer.' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">HR Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" /> Headcount Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {loading ? <p className="text-slate-500">Loading...</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={headcountData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {headcountData.map((_: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-indigo-100 bg-indigo-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-indigo-600" /> Admin Oversight
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-indigo-100">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Pending Leave</p>
                  <p className="text-2xl font-black text-indigo-600">{pendingLeaveCount}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 font-bold" onClick={() => window.location.hash = '#/hr/leave'}>
                  Review
                </Button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-indigo-100">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Timesheets to Approve</p>
                  <p className="text-2xl font-black text-emerald-600">{pendingAttendanceCount}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 font-bold" onClick={() => window.location.hash = '#/hr/attendance'}>
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold uppercase text-slate-500">Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Total Headcount</span><span className="font-bold text-slate-900">{stats.activeEmployees}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-slate-600">Open Positions</span><span className="font-bold text-indigo-600">{stats.activePostings}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, i) => (
          <Card key={i} className="hover:border-indigo-300 transition-colors cursor-pointer group">
            <CardHeader><CardTitle className="text-lg flex items-center justify-between">{report.title}<FileBarChart className="h-5 w-5 text-slate-400 group-hover:text-indigo-500" /></CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-6">{report.description}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2"><Download className="h-4 w-4" /> PDF</Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2"><Printer className="h-4 w-4" /> Print</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HRReports;
