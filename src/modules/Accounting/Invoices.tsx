import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Trash2, Printer, Eye, DollarSign, Clock, AlertCircle, CheckCircle2, X, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useSettings } from '../../contexts/SettingsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { currencySymbol } = useSettings();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [nextNumber, setNextNumber] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  // Create form state
  const [form, setForm] = useState({
    clientName: '',
    customerId: '',
    dueDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    taxRate: 0,
    discount: 0,
    notes: 'Thank you for your business!',
    terms: 'Net 30',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ]);

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'check',
    reference: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [inv, cust, sum, nn] = await Promise.all([
        api.get('/invoices'),
        api.get('/contacts/customers'),
        api.get('/invoices/summary'),
        api.get('/invoices/next-number'),
      ]);
      setInvoices(inv);
      setCustomers(cust);
      setSummary(sum);
      setNextNumber(nn.nextNumber);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Line item helpers
  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;
    if (field === 'quantity' || field === 'rate') {
      updated[index].amount = updated[index].quantity * updated[index].rate;
    }
    setLineItems(updated);
  };

  const addLineItem = () => setLineItems([...lineItems, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  const removeLineItem = (index: number) => { if (lineItems.length > 1) setLineItems(lineItems.filter((_, i) => i !== index)); };

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (form.taxRate / 100);
  const total = subtotal + taxAmount - form.discount;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.every(li => !li.description)) { toast.error('Add at least one line item'); return; }

    // Set due date 30 days from issue if not set
    const dueDate = form.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    try {
      await api.post('/invoices', {
        invoiceNumber: nextNumber,
        customerId: form.customerId || null,
        clientName: form.clientName,
        items: lineItems.filter(li => li.description),
        subtotal,
        taxRate: form.taxRate,
        taxAmount,
        discount: form.discount,
        amount: total,
        notes: form.notes,
        terms: form.terms,
        dueDate,
        issueDate: form.issueDate,
      });
      toast.success('Invoice created');
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) { toast.error(error.message); }
  };

  const resetForm = () => {
    setForm({ clientName: '', customerId: '', dueDate: '', issueDate: new Date().toISOString().split('T')[0], taxRate: 0, discount: 0, notes: 'Thank you for your business!', terms: 'Net 30' });
    setLineItems([{ description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const viewInvoice = async (id: number) => {
    try {
      const data = await api.get(`/invoices/${id}`);
      setSelectedInvoice(data);
      setIsViewOpen(true);
    } catch (error: any) { toast.error(error.message); }
  };

  const openPayment = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentForm({ amount: parseFloat(inv.balance_due || inv.amount || 0), date: new Date().toISOString().split('T')[0], method: 'check', reference: '', notes: '' });
    setIsPaymentOpen(true);
  };

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/invoices/${selectedInvoice.id}/payment`, paymentForm);
      toast.success('Payment recorded');
      setIsPaymentOpen(false);
      fetchData();
    } catch (error: any) { toast.error(error.message); }
  };

  const deleteInvoice = async (id: number) => {
    if (!confirm('Delete this invoice?')) return;
    try { await api.delete(`/invoices/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const printInvoice = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Invoice ${selectedInvoice?.invoice_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .company-name { font-size: 28px; font-weight: 800; color: #4f46e5; margin-bottom: 4px; }
        .company-details { font-size: 12px; color: #64748b; line-height: 1.6; }
        .invoice-title { font-size: 36px; font-weight: 800; color: #1e293b; text-align: right; }
        .invoice-number { font-size: 14px; color: #64748b; text-align: right; margin-top: 4px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
        .meta-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; margin-bottom: 8px; }
        .meta-section p { font-size: 14px; line-height: 1.6; }
        .meta-section .value { font-weight: 600; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        thead th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; }
        tbody td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .text-right { text-align: right; }
        .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
        .totals-table { width: 300px; }
        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
        .totals-row.total { border-top: 2px solid #1e293b; padding-top: 12px; margin-top: 4px; font-size: 18px; font-weight: 800; }
        .totals-row.paid { color: #10b981; }
        .totals-row.due { color: #ef4444; font-weight: 700; }
        .notes { background: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 30px; }
        .notes h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px; }
        .notes p { font-size: 13px; color: #64748b; line-height: 1.6; }
        .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-overdue { background: #fce7f3; color: #9d174d; }
        .status-partial { background: #dbeafe; color: #1e40af; }
        @media print { body { padding: 20px; } }
      </style>
      </head><body>${printRef.current.innerHTML}
      <script>window.print(); window.onafterprint = () => window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const statusColor = (s: string) => {
    switch(s) {
      case 'paid': return 'bg-emerald-100 text-emerald-700';
      case 'overdue': return 'bg-rose-100 text-rose-700';
      case 'partial': return 'bg-blue-100 text-blue-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const inv = selectedInvoice;
  const invItems: LineItem[] = inv?.items ? (typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Invoices</h1>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Create Invoice</DialogTrigger>
          <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Invoice — {nextNumber}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5 pt-4">
              {/* Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select onValueChange={(v: string) => {
                    const cust = customers.find(c => c.id.toString() === v);
                    setForm({...form, customerId: v, clientName: cust?.name || ''});
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select or type below" /></SelectTrigger>
                    <SelectContent>{customers.map(c => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}{c.company ? ` — ${c.company}` : ''}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} placeholder="Bill To" required />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Issue Date</Label><Input type="date" value={form.issueDate} onChange={e => setForm({...form, issueDate: e.target.value})} /></div>
                <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
                <div className="space-y-2"><Label>Terms</Label><Input value={form.terms} onChange={e => setForm({...form, terms: e.target.value})} /></div>
              </div>

              {/* Line Items */}
              <div>
                <Label className="mb-2 block">Line Items</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50"><th className="p-2 text-left font-medium text-slate-600">Description</th><th className="p-2 text-center font-medium text-slate-600 w-20">Qty</th><th className="p-2 text-right font-medium text-slate-600 w-28">Rate ({currencySymbol})</th><th className="p-2 text-right font-medium text-slate-600 w-28">Amount</th><th className="p-2 w-10"></th></tr></thead>
                    <tbody>
                      {lineItems.map((item, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="p-2"><Input className="h-8" value={item.description} onChange={e => updateLineItem(i, 'description', e.target.value)} placeholder="Service or product" /></td>
                          <td className="p-2"><Input className="h-8 text-center" type="number" min="1" value={item.quantity} onChange={e => updateLineItem(i, 'quantity', Number(e.target.value))} /></td>
                          <td className="p-2"><Input className="h-8 text-right" type="number" step="0.01" value={item.rate} onChange={e => updateLineItem(i, 'rate', Number(e.target.value))} /></td>
                          <td className="p-2 text-right font-medium">{currencySymbol}{item.amount.toFixed(2)}</td>
                          <td className="p-2"><button type="button" onClick={() => removeLineItem(i)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-2 border-t border-slate-100"><Button type="button" variant="ghost" size="sm" onClick={addLineItem} className="text-indigo-600 gap-1"><Plus className="h-3 w-3" /> Add Line</Button></div>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">{currencySymbol}{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center gap-2"><span className="text-slate-500">Tax (%)</span><Input className="h-7 w-20 text-right" type="number" step="0.1" value={form.taxRate} onChange={e => setForm({...form, taxRate: Number(e.target.value)})} /><span className="font-medium w-20 text-right">{currencySymbol}{taxAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center gap-2"><span className="text-slate-500">Discount</span><Input className="h-7 w-20 text-right" type="number" step="0.01" value={form.discount} onChange={e => setForm({...form, discount: Number(e.target.value)})} /></div>
                  <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{currencySymbol}{total.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes visible on invoice" /></div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Create Invoice</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-lg"><DollarSign className="h-5 w-5 text-indigo-600" /></div><div><p className="text-xs text-slate-500">Total Invoiced</p><p className="text-xl font-bold">{currencySymbol}{parseFloat(summary.total_amount || 0).toLocaleString()}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-emerald-100 p-2 rounded-lg"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div><div><p className="text-xs text-slate-500">Paid</p><p className="text-xl font-bold text-emerald-600">{currencySymbol}{parseFloat(summary.total_paid || 0).toLocaleString()}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-amber-100 p-2 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div><div><p className="text-xs text-slate-500">Outstanding</p><p className="text-xl font-bold text-amber-600">{currencySymbol}{parseFloat(summary.total_outstanding || 0).toLocaleString()}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-rose-100 p-2 rounded-lg"><AlertCircle className="h-5 w-5 text-rose-600" /></div><div><p className="text-xs text-slate-500">Overdue</p><p className="text-xl font-bold text-rose-600">{currencySymbol}{parseFloat(summary.total_overdue || 0).toLocaleString()}</p></div></div></Card>
      </div>

      {/* Invoice List */}
      <Card className="bg-white border-slate-200 overflow-hidden">
        <CardHeader><CardTitle>All Invoices</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead>Due</TableHead><TableHead>Amount</TableHead><TableHead>Paid</TableHead><TableHead>Balance</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? (<TableRow><TableCell colSpan={9} className="text-center py-10 text-slate-500">Loading...</TableCell></TableRow>
                ) : invoices.length === 0 ? (<TableRow><TableCell colSpan={9} className="text-center py-10 text-slate-500">No invoices yet. Create your first invoice!</TableCell></TableRow>
                ) : (invoices.map((inv: any) => (
                  <TableRow key={inv.id} className="cursor-pointer hover:bg-slate-50" onClick={() => viewInvoice(inv.id)}>
                    <TableCell className="font-mono font-medium text-indigo-600">{inv.invoice_number}</TableCell>
                    <TableCell className="font-medium">{inv.client_name}</TableCell>
                    <TableCell className="text-slate-500">{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-slate-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="font-medium">{currencySymbol}{parseFloat(inv.amount || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</TableCell>
                    <TableCell className="text-emerald-600">{currencySymbol}{parseFloat(inv.amount_paid || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</TableCell>
                    <TableCell className="font-bold">{currencySymbol}{parseFloat(inv.balance_due || inv.amount || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</TableCell>
                    <TableCell><Badge className={statusColor(inv.status)}>{inv.status}</Badge></TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => viewInvoice(inv.id)} title="View"><Eye className="h-4 w-4" /></Button>
                        {inv.status !== 'paid' && <Button variant="ghost" size="icon" onClick={() => openPayment(inv)} className="text-emerald-500" title="Record Payment"><CreditCard className="h-4 w-4" /></Button>}
                        <Button variant="ghost" size="icon" onClick={() => deleteInvoice(inv.id)} className="text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View / Print Invoice Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Invoice {inv?.invoice_number}</DialogTitle>
              <Button variant="outline" onClick={printInvoice} className="gap-2"><Printer className="h-4 w-4" /> Print</Button>
            </div>
          </DialogHeader>
          {inv && (
            <div ref={printRef}>
              {/* Printable Invoice */}
              <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#1e293b', padding: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#4f46e5' }}>{inv.company?.company_name || 'Bytz360 Insurance'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6, marginTop: '4px' }}>
                      {inv.company?.address || '123 Business Ave'}<br/>
                      {inv.company?.city || 'New York'}, {inv.company?.state || 'NY'} {inv.company?.zip || '10001'}<br/>
                      {inv.company?.phone || ''}<br/>
                      {inv.company?.email || ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '32px', fontWeight: 800 }}>INVOICE</div>
                    <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{inv.invoice_number}</div>
                    <div style={{ marginTop: '12px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: inv.status === 'paid' ? '#d1fae5' : inv.status === 'overdue' ? '#fce7f3' : '#fef3c7', color: inv.status === 'paid' ? '#065f46' : inv.status === 'overdue' ? '#9d174d' : '#92400e' }}>{inv.status?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Bill To & Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>Bill To</div>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>{inv.client_name}</div>
                    {inv.customer_company && <div style={{ fontSize: '13px', color: '#64748b' }}>{inv.customer_company}</div>}
                    {inv.customer_address && <div style={{ fontSize: '13px', color: '#64748b' }}>{inv.customer_address}</div>}
                    {(inv.customer_city || inv.customer_state) && <div style={{ fontSize: '13px', color: '#64748b' }}>{inv.customer_city}, {inv.customer_state} {inv.customer_zip}</div>}
                    {inv.customer_email && <div style={{ fontSize: '13px', color: '#64748b' }}>{inv.customer_email}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '8px' }}><span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 700 }}>Issue Date </span><span style={{ fontWeight: 600 }}>{inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '-'}</span></div>
                    <div style={{ marginBottom: '8px' }}><span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 700 }}>Due Date </span><span style={{ fontWeight: 600 }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</span></div>
                    {inv.terms && <div><span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 700 }}>Terms </span><span style={{ fontWeight: 600 }}>{inv.terms}</span></div>}
                  </div>
                </div>

                {/* Line Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>Description</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>Qty</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>Rate</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invItems.map((item: any, i: number) => (
                      <tr key={i}>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>{item.description}</td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', textAlign: 'right' }}>{currencySymbol}{parseFloat(item.rate || 0).toFixed(2)}</td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>{currencySymbol}{parseFloat(item.amount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                  <div style={{ width: '280px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}><span style={{ color: '#64748b' }}>Subtotal</span><span>{currencySymbol}{parseFloat(inv.subtotal || 0).toFixed(2)}</span></div>
                    {parseFloat(inv.tax_amount || 0) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}><span style={{ color: '#64748b' }}>Tax ({parseFloat(inv.tax_rate || 0)}%)</span><span>{currencySymbol}{parseFloat(inv.tax_amount || 0).toFixed(2)}</span></div>}
                    {parseFloat(inv.discount || 0) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}><span style={{ color: '#64748b' }}>Discount</span><span style={{ color: '#ef4444' }}>-{currencySymbol}{parseFloat(inv.discount || 0).toFixed(2)}</span></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 8px', fontSize: '18px', fontWeight: 800, borderTop: '2px solid #1e293b', marginTop: '4px' }}><span>Total</span><span>{currencySymbol}{parseFloat(inv.amount || 0).toFixed(2)}</span></div>
                    {parseFloat(inv.amount_paid || 0) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: '#10b981' }}><span>Paid</span><span>-{currencySymbol}{parseFloat(inv.amount_paid || 0).toFixed(2)}</span></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '16px', fontWeight: 700, color: parseFloat(inv.balance_due || 0) > 0 ? '#ef4444' : '#10b981' }}><span>Balance Due</span><span>{currencySymbol}{parseFloat(inv.balance_due || inv.amount || 0).toFixed(2)}</span></div>
                  </div>
                </div>

                {/* Notes */}
                {inv.notes && (
                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '20px', marginTop: '24px' }}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>Notes</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{inv.notes}</div>
                  </div>
                )}

                {/* Payment History */}
                {inv.payments && inv.payments.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 700, marginBottom: '12px' }}>Payment History</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ backgroundColor: '#f0fdf4' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#064e3b' }}>Date</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#064e3b' }}>Method</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#064e3b' }}>Reference</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', color: '#064e3b' }}>Amount</th>
                      </tr></thead>
                      <tbody>{inv.payments.map((p: any) => (
                        <tr key={p.id}><td style={{ padding: '8px 12px', fontSize: '13px' }}>{new Date(p.date).toLocaleDateString()}</td><td style={{ padding: '8px 12px', fontSize: '13px', textTransform: 'capitalize' }}>{p.method}</td><td style={{ padding: '8px 12px', fontSize: '13px' }}>{p.reference}</td><td style={{ padding: '8px 12px', fontSize: '13px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{currencySymbol}{parseFloat(p.amount).toFixed(2)}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: '48px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  {inv.company?.company_name || 'Bytz360 Insurance'} • {inv.company?.phone || '(555) 123-4567'} • {inv.company?.email || 'billing@bytz360.com'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader><DialogTitle>Record Payment — {selectedInvoice?.invoice_number}</DialogTitle></DialogHeader>
          <form onSubmit={recordPayment} className="space-y-4 pt-4">
            <div className="bg-slate-50 rounded-lg p-3 text-sm flex justify-between">
              <span className="text-slate-500">Balance Due</span>
              <span className="font-bold text-lg">{currencySymbol}{parseFloat(selectedInvoice?.balance_due || selectedInvoice?.amount || 0).toFixed(2)}</span>
            </div>
            <div className="space-y-2"><Label>Payment Amount ({currencySymbol})</Label><Input type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} /></div>
              <div className="space-y-2"><Label>Method</Label>
                <Select value={paymentForm.method} onValueChange={(v: string) => setPaymentForm({...paymentForm, method: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="check">Check</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="credit_card">Credit Card</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Reference / Check #</Label><Input value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} placeholder="Optional" /></div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Record Payment</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
