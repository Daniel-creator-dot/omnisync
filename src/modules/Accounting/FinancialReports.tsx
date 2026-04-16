import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Printer, TrendingUp, TrendingDown, DollarSign, BarChart3, ArrowRightLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const FinancialReports = () => {
  const [pnl, setPnl] = useState<any>(null);
  const [bs, setBs] = useState<any>(null);
  const [cf, setCf] = useState<any>(null);
  const [arAging, setArAging] = useState<any>(null);
  const [apAging, setApAging] = useState<any>(null);
  const [trial, setTrial] = useState<any>(null);
  const [revByCust, setRevByCust] = useState<any[]>([]);
  const [expSummary, setExpSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { currencySymbol } = useSettings();
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.get('/settings/reports/profit-loss').catch(() => null),
      api.get('/settings/reports/balance-sheet').catch(() => null),
      api.get('/settings/reports/cash-flow').catch(() => null),
      api.get('/settings/reports/ar-aging').catch(() => null),
      api.get('/settings/reports/ap-aging').catch(() => null),
      api.get('/settings/reports/trial-balance').catch(() => null),
      api.get('/settings/reports/revenue-by-customer').catch(() => []),
      api.get('/settings/reports/expense-summary').catch(() => null),
    ]).then(([p, b, c, ar, ap, tb, rc, es]) => {
      setPnl(p); setBs(b); setCf(c); setArAging(ar); setApAging(ap); setTrial(tb); setRevByCust(rc || []); setExpSummary(es);
    }).finally(() => setLoading(false));
  }, []);

  const printReport = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Financial Reports</title>
      <style>body{font-family:'Segoe UI',system-ui,sans-serif;padding:40px;max-width:900px;margin:0 auto;color:#1e293b;font-size:13px}
      h1{font-size:22px;margin-bottom:4px}h2{font-size:16px;margin:20px 0 10px;color:#4f46e5;border-bottom:2px solid #e2e8f0;padding-bottom:6px}
      table{width:100%;border-collapse:collapse;margin:8px 0}th,td{padding:6px 10px;text-align:left;border-bottom:1px solid #f1f5f9}
      th{background:#f8fafc;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
      .total-row{font-weight:700;border-top:2px solid #334155}
      .positive{color:#10b981}.negative{color:#ef4444}.muted{color:#64748b}
      @media print{body{padding:20px;font-size:11px}}</style>
      </head><body>${printRef.current.innerHTML}
      <script>window.print();window.onafterprint=()=>window.close();</script></body></html>`);
    w.document.close();
  };

  const fmt = (n: number) => currencySymbol + Math.abs(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
  const totalAssets = bs ? (bs.assets.cash + bs.assets.accountsReceivable + bs.assets.fixedAssets + bs.assets.otherAssets) : 0;
  const totalLiabilities = bs ? (bs.liabilities.accountsPayable + bs.liabilities.otherLiabilities) : 0;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Financial Reports</h1>
        <Button variant="outline" onClick={printReport} className="gap-2"><Printer className="h-4 w-4" /> Print Report</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-emerald-100 p-2 rounded-lg"><TrendingUp className="h-5 w-5 text-emerald-600" /></div><div><p className="text-xs text-slate-500">Revenue</p><p className="text-lg sm:text-xl font-bold text-emerald-600">{fmt(pnl?.revenue)}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-rose-100 p-2 rounded-lg"><TrendingDown className="h-5 w-5 text-rose-600" /></div><div><p className="text-xs text-slate-500">Expenses</p><p className="text-lg sm:text-xl font-bold text-rose-600">{fmt(pnl?.totalExpenses)}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-lg"><DollarSign className="h-5 w-5 text-indigo-600" /></div><div><p className="text-xs text-slate-500">Net Income</p><p className={`text-lg sm:text-xl font-bold ${(pnl?.netIncome || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(pnl?.netIncome)}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-violet-100 p-2 rounded-lg"><BarChart3 className="h-5 w-5 text-violet-600" /></div><div><p className="text-xs text-slate-500">Total Assets</p><p className="text-lg sm:text-xl font-bold">{fmt(totalAssets)}</p></div></div></Card>
      </div>

      <div ref={printRef}>
        <Tabs defaultValue="pnl" className="w-full">
          <div className="overflow-x-auto"><TabsList className="w-max">
            <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
            <TabsTrigger value="bs">Balance Sheet</TabsTrigger>
            <TabsTrigger value="cf">Cash Flow</TabsTrigger>
            <TabsTrigger value="tb">Trial Balance</TabsTrigger>
            <TabsTrigger value="ar">AR Aging</TabsTrigger>
            <TabsTrigger value="ap">AP Aging</TabsTrigger>
            <TabsTrigger value="rev">Revenue</TabsTrigger>
            <TabsTrigger value="exp">Expenses</TabsTrigger>
          </TabsList></div>

          {/* P&L */}
          <TabsContent value="pnl" className="mt-6">
            <Card><CardHeader className="border-b"><CardTitle>Profit & Loss Statement</CardTitle><p className="text-sm text-slate-500">As of {new Date().toLocaleDateString()}</p></CardHeader>
              <CardContent className="py-6 space-y-6">
                <div><h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3">Revenue</h3>
                  <div className="flex justify-between py-2 px-3 bg-emerald-50 rounded-lg"><span className="font-medium">Total Revenue</span><span className="font-bold text-emerald-600">{fmt(pnl?.revenue)}</span></div></div>
                <div><h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3">Expenses</h3>
                  <div className="space-y-1">
                    {pnl?.expensesByCategory?.map((c: any, i: number) => (<div key={i} className="flex justify-between py-2 px-3 hover:bg-slate-50 rounded"><span>{c.category}</span><span className="font-medium text-rose-600">{fmt(parseFloat(c.total))}</span></div>))}
                    <div className="flex justify-between py-2 px-3 hover:bg-slate-50 rounded"><span>Payroll Costs</span><span className="font-medium text-rose-600">{fmt(pnl?.payrollCosts)}</span></div>
                  </div>
                  <div className="flex justify-between py-2 px-3 bg-rose-50 rounded-lg mt-2"><span className="font-bold">Total Expenses</span><span className="font-bold text-rose-600">{fmt(pnl?.totalExpenses)}</span></div></div>
                <div className="border-t-2 border-slate-900 pt-4"><div className="flex justify-between py-3 px-4 rounded-lg bg-slate-900 text-white"><span className="font-bold text-lg">Net Income</span><span className={`font-bold text-lg ${(pnl?.netIncome || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{(pnl?.netIncome || 0) < 0 ? '-' : ''}{fmt(pnl?.netIncome)}</span></div></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balance Sheet */}
          <TabsContent value="bs" className="mt-6">
            <Card><CardHeader className="border-b"><CardTitle>Balance Sheet</CardTitle><p className="text-sm text-slate-500">As of {new Date().toLocaleDateString()}</p></CardHeader>
              <CardContent className="py-6 space-y-6">
                <div><h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3">Assets</h3>
                  <div className="space-y-1">
                    {[['Cash & Bank', bs?.assets?.cash], ['Accounts Receivable', bs?.assets?.accountsReceivable], ['Fixed Assets', bs?.assets?.fixedAssets], ['Other Assets', bs?.assets?.otherAssets]].map(([n, v]) => (
                      <div key={n as string} className="flex justify-between py-2 px-3 hover:bg-slate-50 rounded"><span>{n}</span><span className="font-medium">{fmt(v as number)}</span></div>
                    ))}
                  </div>
                  <div className="flex justify-between py-2 px-3 bg-indigo-50 rounded-lg mt-2"><span className="font-bold">Total Assets</span><span className="font-bold text-indigo-600">{fmt(totalAssets)}</span></div></div>
                <div><h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3">Liabilities</h3>
                  <div className="space-y-1">
                    {[['Accounts Payable', bs?.liabilities?.accountsPayable], ['Other Liabilities', bs?.liabilities?.otherLiabilities]].map(([n, v]) => (
                      <div key={n as string} className="flex justify-between py-2 px-3 hover:bg-slate-50 rounded"><span>{n}</span><span className="font-medium">{fmt(v as number)}</span></div>
                    ))}
                  </div>
                  <div className="flex justify-between py-2 px-3 bg-amber-50 rounded-lg mt-2"><span className="font-bold">Total Liabilities</span><span className="font-bold text-amber-600">{fmt(totalLiabilities)}</span></div></div>
                <div><h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3">Equity</h3>
                  <div className="flex justify-between py-2 px-3 hover:bg-slate-50 rounded"><span>Owner's Equity</span><span className="font-medium">{fmt(bs?.equity)}</span></div>
                  <div className="flex justify-between py-2 px-3 hover:bg-slate-50 rounded"><span>Retained Earnings</span><span className="font-medium">{fmt(pnl?.netIncome)}</span></div>
                  <div className="flex justify-between py-2 px-3 bg-violet-50 rounded-lg mt-2"><span className="font-bold">Total Equity</span><span className="font-bold text-violet-600">{fmt((bs?.equity || 0) + (pnl?.netIncome || 0))}</span></div></div>
                <div className="border-t-2 border-slate-900 pt-4"><div className="flex justify-between py-3 px-4 rounded-lg bg-slate-900 text-white"><span className="font-bold text-lg">Total L + E</span><span className="font-bold text-lg">{fmt(totalLiabilities + (bs?.equity || 0) + (pnl?.netIncome || 0))}</span></div></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cash Flow */}
          <TabsContent value="cf" className="mt-6">
            <Card><CardHeader className="border-b"><CardTitle>Cash Flow Statement</CardTitle></CardHeader>
              <CardContent className="py-6 space-y-6">
                <div><h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3">Operating Activities</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between py-2 px-3 hover:bg-slate-50 rounded"><span>Customer Payments Received</span><span className="font-medium text-emerald-600">+{fmt(cf?.operating?.cashIn)}</span></div>
                    <div className="flex justify-between py-2 px-3 hover:bg-slate-50 rounded"><span>Expenses Paid</span><span className="font-medium text-rose-600">-{fmt(cf?.operating?.cashOutExpenses)}</span></div>
                    <div className="flex justify-between py-2 px-3 hover:bg-slate-50 rounded"><span>Payroll Paid</span><span className="font-medium text-rose-600">-{fmt(cf?.operating?.cashOutPayroll)}</span></div>
                  </div>
                  <div className="flex justify-between py-2 px-3 bg-slate-100 rounded-lg mt-2"><span className="font-bold">Net Operating Cash Flow</span><span className={`font-bold ${(cf?.operating?.net || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(cf?.operating?.net)}</span></div>
                </div>
                <div className="flex justify-between py-2 px-3 bg-indigo-50 rounded-lg"><span className="font-bold">Bank Balance</span><span className="font-bold text-indigo-600">{fmt(cf?.bankBalance)}</span></div>
                <div className="border-t-2 border-slate-900 pt-4"><div className="flex justify-between py-3 px-4 rounded-lg bg-slate-900 text-white"><span className="font-bold text-lg">Net Cash Flow</span><span className={`font-bold text-lg ${(cf?.netCashFlow || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(cf?.netCashFlow)}</span></div></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trial Balance */}
          <TabsContent value="tb" className="mt-6">
            <Card><CardHeader className="border-b flex flex-row items-center justify-between"><CardTitle>Trial Balance</CardTitle>
              {trial && <Badge className={trial.isBalanced ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>{trial.isBalanced ? '✓ Balanced' : '✗ Unbalanced'}</Badge>}
            </CardHeader>
              <CardContent className="p-0"><div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Account</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {trial?.accounts?.map((a: any, i: number) => (
                      <TableRow key={i}><TableCell className="font-mono text-sm">{a.code}</TableCell><TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{a.type}</Badge></TableCell>
                        <TableCell className="text-right font-medium">{a.debit > 0 ? fmt(a.debit) : '-'}</TableCell>
                        <TableCell className="text-right font-medium">{a.credit > 0 ? fmt(a.credit) : '-'}</TableCell></TableRow>
                    ))}
                    <TableRow className="bg-slate-50 font-bold"><TableCell colSpan={3} className="text-right">Totals</TableCell>
                      <TableCell className="text-right">{fmt(trial?.totalDebits)}</TableCell><TableCell className="text-right">{fmt(trial?.totalCredits)}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div></CardContent>
            </Card>
          </TabsContent>

          {/* AR Aging */}
          <TabsContent value="ar" className="mt-6">
            <Card><CardHeader className="border-b"><CardTitle>Accounts Receivable Aging</CardTitle></CardHeader>
              <CardContent className="py-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {['current', '1-30', '31-60', '61-90', '90+'].map(bucket => {
                    const val = arAging?.buckets?.[bucket] || 0;
                    const colors: Record<string,string> = { current: 'bg-emerald-50 text-emerald-700', '1-30': 'bg-blue-50 text-blue-700', '31-60': 'bg-amber-50 text-amber-700', '61-90': 'bg-orange-50 text-orange-700', '90+': 'bg-rose-50 text-rose-700' };
                    return <div key={bucket} className={`p-3 rounded-lg ${colors[bucket]}`}><p className="text-xs font-medium uppercase">{bucket === 'current' ? 'Current' : `${bucket} Days`}</p><p className="text-lg font-bold">{fmt(val)}</p></div>;
                  })}
                </div>
                <div className="overflow-x-auto"><Table>
                  <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead className="hidden sm:table-cell">Due Date</TableHead><TableHead>Balance</TableHead><TableHead>Age</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {arAging?.invoices?.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No outstanding receivables</TableCell></TableRow> :
                    arAging?.invoices?.map((inv: any, i: number) => (
                      <TableRow key={i}><TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell><TableCell className="font-medium">{inv.client_name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-slate-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="font-bold">{fmt(parseFloat(inv.balance_due || inv.amount))}</TableCell>
                        <TableCell><Badge variant="outline" className={inv.aging_bucket === 'current' ? 'border-emerald-200' : inv.aging_bucket === '90+' ? 'border-rose-200 text-rose-700' : ''}>{inv.aging_bucket === 'current' ? 'Current' : `${inv.aging_bucket}d`}</Badge></TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table></div>
                <div className="flex justify-between py-2 px-3 bg-slate-900 text-white rounded-lg"><span className="font-bold">Total Outstanding</span><span className="font-bold">{fmt(arAging?.total)}</span></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AP Aging */}
          <TabsContent value="ap" className="mt-6">
            <Card><CardHeader className="border-b"><CardTitle>Accounts Payable Aging</CardTitle></CardHeader>
              <CardContent className="py-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {['current', '1-30', '31-60', '61-90', '90+'].map(bucket => {
                    const val = apAging?.buckets?.[bucket] || 0;
                    const colors: Record<string,string> = { current: 'bg-emerald-50 text-emerald-700', '1-30': 'bg-blue-50 text-blue-700', '31-60': 'bg-amber-50 text-amber-700', '61-90': 'bg-orange-50 text-orange-700', '90+': 'bg-rose-50 text-rose-700' };
                    return <div key={bucket} className={`p-3 rounded-lg ${colors[bucket]}`}><p className="text-xs font-medium uppercase">{bucket === 'current' ? 'Current' : `${bucket} Days`}</p><p className="text-lg font-bold">{fmt(val)}</p></div>;
                  })}
                </div>
                <div className="overflow-x-auto"><Table>
                  <TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead className="hidden sm:table-cell">Due Date</TableHead><TableHead>Balance</TableHead><TableHead>Age</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {apAging?.bills?.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No outstanding payables</TableCell></TableRow> :
                    apAging?.bills?.map((b: any, i: number) => (
                      <TableRow key={i}><TableCell className="font-medium">{b.vendor_name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-slate-500">{b.due_date ? new Date(b.due_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="font-bold">{fmt(parseFloat(b.balance))}</TableCell>
                        <TableCell><Badge variant="outline">{b.aging_bucket === 'current' ? 'Current' : `${b.aging_bucket}d`}</Badge></TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table></div>
                <div className="flex justify-between py-2 px-3 bg-slate-900 text-white rounded-lg"><span className="font-bold">Total Payable</span><span className="font-bold">{fmt(apAging?.total)}</span></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue by Customer */}
          <TabsContent value="rev" className="mt-6">
            <Card><CardHeader className="border-b"><CardTitle>Revenue by Customer</CardTitle></CardHeader>
              <CardContent className="p-0"><div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Invoices</TableHead><TableHead>Total Invoiced</TableHead><TableHead className="hidden sm:table-cell">Paid</TableHead><TableHead>Outstanding</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {revByCust.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No invoice data</TableCell></TableRow> :
                    revByCust.map((c: any, i: number) => (
                      <TableRow key={i}><TableCell className="font-medium">{c.client_name}</TableCell>
                        <TableCell><Badge variant="outline">{c.invoice_count}</Badge></TableCell>
                        <TableCell className="font-bold">{fmt(parseFloat(c.total_invoiced))}</TableCell>
                        <TableCell className="hidden sm:table-cell text-emerald-600">{fmt(parseFloat(c.total_paid))}</TableCell>
                        <TableCell className={parseFloat(c.total_outstanding) > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>{fmt(parseFloat(c.total_outstanding))}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div></CardContent>
            </Card>
          </TabsContent>

          {/* Expense Summary */}
          <TabsContent value="exp" className="mt-6">
            <Card><CardHeader className="border-b"><CardTitle>Expense Summary</CardTitle><p className="text-sm text-slate-500">Total approved: {fmt(expSummary?.total)}</p></CardHeader>
              <CardContent className="py-6 space-y-6">
                <div><h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3">By Category</h3>
                  <div className="space-y-2">
                    {expSummary?.byCategory?.map((c: any, i: number) => {
                      const pct = expSummary.total > 0 ? (parseFloat(c.total) / expSummary.total * 100) : 0;
                      return (<div key={i}>
                        <div className="flex justify-between items-center mb-1"><span className="text-sm font-medium">{c.category} ({c.count})</span><span className="font-bold text-sm">{fmt(parseFloat(c.total))}</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full transition-all" style={{width: `${pct}%`}}></div></div>
                      </div>);
                    })}
                  </div></div>
                {expSummary?.byMonth?.length > 0 && (
                  <div><h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3">Monthly Trend</h3>
                    <div className="space-y-1">
                      {expSummary.byMonth.map((m: any, i: number) => (
                        <div key={i} className="flex justify-between py-2 px-3 hover:bg-slate-50 rounded"><span className="text-sm text-slate-600">{m.month}</span><span className="font-medium">{fmt(parseFloat(m.total))}</span></div>
                      ))}
                    </div></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default FinancialReports;
