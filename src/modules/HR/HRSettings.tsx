import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Plus, Trash2, Settings2, MessageSquare, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';

const HRSettings = () => {
  const [payrollSettings, setPayrollSettings] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [smsConfig, setSmsConfig] = useState({ provider: '', base_url: '', sender_id: '', api_key: '', api_secret: '', is_active: true });
  const [loading, setLoading] = useState(true);

  // Form states
  const [isDeductionOpen, setIsDeductionOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isFYOpen, setIsFYOpen] = useState(false);
  const [newDeduction, setNewDeduction] = useState({ name: '', type: 'percentage', value: 0, description: '' });
  const [newDept, setNewDept] = useState({ name: '' });
  const [newPolicy, setNewPolicy] = useState({ title: '', content: '', category: '' });
  const [newFY, setNewFY] = useState({ name: '', startDate: '', endDate: '' });

  const fetchData = async () => {
    try {
      const [ps, d, p, fy, sms] = await Promise.all([
        api.get('/settings/payroll-settings'), api.get('/settings/departments'),
        api.get('/settings/policies'), api.get('/settings/fiscal-years'),
        api.get('/settings/sms')
      ]);
      setPayrollSettings(ps); setDepartments(d); setPolicies(p); setFiscalYears(fy);
      setSmsConfig(sms || { provider: '', base_url: '', sender_id: '', api_key: '', api_secret: '', is_active: true });
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const addDeduction = async (e: React.FormEvent) => { e.preventDefault(); try { await api.post('/settings/payroll-settings', newDeduction); toast.success('Added'); setIsDeductionOpen(false); setNewDeduction({ name: '', type: 'percentage', value: 0, description: '' }); fetchData(); } catch(err:any) { toast.error(err.message); } };
  const addDept = async (e: React.FormEvent) => { e.preventDefault(); try { await api.post('/settings/departments', newDept); toast.success('Added'); setIsDeptOpen(false); setNewDept({ name: '' }); fetchData(); } catch(err:any) { toast.error(err.message); } };
  const addPolicy = async (e: React.FormEvent) => { e.preventDefault(); try { await api.post('/settings/policies', newPolicy); toast.success('Added'); setIsPolicyOpen(false); setNewPolicy({ title: '', content: '', category: '' }); fetchData(); } catch(err:any) { toast.error(err.message); } };
  const addFY = async (e: React.FormEvent) => { e.preventDefault(); try { await api.post('/settings/fiscal-years', newFY); toast.success('Added'); setIsFYOpen(false); setNewFY({ name: '', startDate: '', endDate: '' }); fetchData(); } catch(err:any) { toast.error(err.message); } };

  const updateSmsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settings/sms', smsConfig);
      toast.success('SMS Configuration saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const deleteItem = async (endpoint: string, id: string) => { if (!confirm('Delete?')) return; try { await api.delete(`/settings/${endpoint}/${id}`); toast.success('Deleted'); fetchData(); } catch(err:any) { toast.error(err.message); } };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">HR Settings</h1>
      <Tabs defaultValue="payroll" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal Years</TabsTrigger>
          <TabsTrigger value="sms">SMS Config</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payroll Settings</CardTitle>
              <Dialog open={isDeductionOpen} onOpenChange={setIsDeductionOpen}>
                <DialogTrigger render={<Button className="bg-indigo-600 gap-2" />}><Plus className="h-4 w-4" /> Add</DialogTrigger>
                <DialogContent><DialogHeader><DialogTitle>Add Payroll Setting</DialogTitle></DialogHeader>
                  <form onSubmit={addDeduction} className="space-y-4 pt-4">
                    <div className="space-y-2"><Label>Name</Label><Input value={newDeduction.name} onChange={e => setNewDeduction({...newDeduction, name: e.target.value})} required /></div>
                    <div className="space-y-2"><Label>Value</Label><Input type="number" step="0.01" value={newDeduction.value} onChange={e => setNewDeduction({...newDeduction, value: Number(e.target.value)})} required /></div>
                    <div className="space-y-2"><Label>Description</Label><Input value={newDeduction.description} onChange={e => setNewDeduction({...newDeduction, description: e.target.value})} /></div>
                    <Button type="submit" className="w-full bg-indigo-600">Add</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Value</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{loading ? <TableRow><TableCell colSpan={4} className="text-center py-10">Loading...</TableCell></TableRow> : payrollSettings.map((s: any) => (
                  <TableRow key={s.id}><TableCell>{s.name}</TableCell><TableCell>{s.value}</TableCell><TableCell>{s.description}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteItem('payroll-settings', s.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Departments</CardTitle>
              <Dialog open={isDeptOpen} onOpenChange={setIsDeptOpen}>
                <DialogTrigger render={<Button className="bg-indigo-600 gap-2" />}><Plus className="h-4 w-4" /> Add</DialogTrigger>
                <DialogContent><DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
                  <form onSubmit={addDept} className="space-y-4 pt-4">
                    <div className="space-y-2"><Label>Name</Label><Input value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} required /></div>
                    <Button type="submit" className="w-full bg-indigo-600">Add</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Department</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{departments.map((d: any) => (
                  <TableRow key={d.id}><TableCell>{d.name}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteItem('departments', d.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Policies</CardTitle>
              <Dialog open={isPolicyOpen} onOpenChange={setIsPolicyOpen}>
                <DialogTrigger render={<Button className="bg-indigo-600 gap-2" />}><Plus className="h-4 w-4" /> Add</DialogTrigger>
                <DialogContent><DialogHeader><DialogTitle>Add Policy</DialogTitle></DialogHeader>
                  <form onSubmit={addPolicy} className="space-y-4 pt-4">
                    <div className="space-y-2"><Label>Title</Label><Input value={newPolicy.title} onChange={e => setNewPolicy({...newPolicy, title: e.target.value})} required /></div>
                    <div className="space-y-2"><Label>Category</Label><Input value={newPolicy.category} onChange={e => setNewPolicy({...newPolicy, category: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Content</Label><Input value={newPolicy.content} onChange={e => setNewPolicy({...newPolicy, content: e.target.value})} /></div>
                    <Button type="submit" className="w-full bg-indigo-600">Add</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{policies.map((p: any) => (
                  <TableRow key={p.id}><TableCell>{p.title}</TableCell><TableCell>{p.category}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteItem('policies', p.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Fiscal Years</CardTitle>
              <Dialog open={isFYOpen} onOpenChange={setIsFYOpen}>
                <DialogTrigger render={<Button className="bg-indigo-600 gap-2" />}><Plus className="h-4 w-4" /> Add</DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Fiscal Year</DialogTitle></DialogHeader>
                  <form onSubmit={addFY} className="space-y-4 pt-4">
                    <div className="space-y-2"><Label>Name</Label><Input value={newFY.name} onChange={e => setNewFY({...newFY, name: e.target.value})} required /></div>
                    <div className="space-y-2"><Label>Start</Label><Input type="date" value={newFY.startDate} onChange={e => setNewFY({...newFY, startDate: e.target.value})} required /></div>
                    <div className="space-y-2"><Label>End</Label><Input type="date" value={newFY.endDate} onChange={e => setNewFY({...newFY, endDate: e.target.value})} required /></div>
                    <Button type="submit" className="w-full bg-indigo-600">Add</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fiscalYears.map((fy: any) => (
                    <TableRow key={fy.id}>
                      <TableCell>{fy.name}</TableCell>
                      <TableCell>{new Date(fy.start_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(fy.end_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteItem('fiscal-years', fy.id)} className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                SMS Provider Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={updateSmsConfig} className="space-y-6 max-w-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">SMS Provider Name</Label>
                    <Input 
                      id="provider" 
                      placeholder="e.g. SMS Notify, Twilio" 
                      value={smsConfig.provider} 
                      onChange={e => setSmsConfig({...smsConfig, provider: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sender_id">Sender ID (From Name)</Label>
                    <Input 
                      id="sender_id" 
                      placeholder="OMNISYNC" 
                      value={smsConfig.sender_id} 
                      onChange={e => setSmsConfig({...smsConfig, sender_id: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="base_url">Provider Base URL (API Endpoint)</Label>
                  <Input 
                    id="base_url" 
                    placeholder="https://api.provider.com/send" 
                    value={smsConfig.base_url} 
                    onChange={e => setSmsConfig({...smsConfig, base_url: e.target.value})} 
                    required 
                  />
                  <p className="text-xs text-slate-500">The gateway URL that receives SMS requests.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="api_key">Provider API Key</Label>
                    <Input 
                      id="api_key" 
                      type="password"
                      placeholder="••••••••••••••••" 
                      value={smsConfig.api_key} 
                      onChange={e => setSmsConfig({...smsConfig, api_key: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api_secret">Provider API Secret</Label>
                    <Input 
                      id="api_secret" 
                      type="password"
                      placeholder="••••••••••••••••" 
                      value={smsConfig.api_secret} 
                      onChange={e => setSmsConfig({...smsConfig, api_secret: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    checked={smsConfig.is_active} 
                    onChange={e => setSmsConfig({...smsConfig, is_active: e.target.checked})}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <Label htmlFor="is_active" className="text-sm font-medium leading-none cursor-pointer">
                    Enable SMS OTP Service
                  </Label>
                </div>

                <Button type="submit" className="bg-indigo-600 gap-2">
                  <Save className="h-4 w-4" /> Save SMS Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRSettings;
