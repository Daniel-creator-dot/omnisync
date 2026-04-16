import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Building2, Save, Receipt } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'sonner';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';

const AccountingSettings = () => {
  const [company, setCompany] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { refreshSettings } = useSettings();

  const currencies = [
    { code: 'USD', label: 'USD ($ - US Dollar)' },
    { code: 'GHS', label: 'GHS (₵ - Ghanaian Cedi)' },
    { code: 'NGN', label: 'NGN (₦ - Nigerian Naira)' },
    { code: 'EUR', label: 'EUR (€ - Euro)' },
    { code: 'GBP', label: 'GBP (£ - British Pound)' },
    { code: 'KES', label: 'KES (KSh - Kenyan Shilling)' },
    { code: 'INR', label: 'INR (₹ - Indian Rupee)' },
  ];

  useEffect(() => {
    api.get('/settings/company').then(setCompany).catch(console.error).finally(() => setLoading(false));
  }, []);

  const saveCompany = async () => {
    setSaving(true);
    try {
      const result = await api.put('/settings/company', {
        companyName: company.company_name,
        address: company.address,
        city: company.city,
        state: company.state,
        zip: company.zip,
        phone: company.phone,
        email: company.email,
        website: company.website,
        taxId: company.tax_id,
        invoicePrefix: company.invoice_prefix,
        paymentTerms: company.payment_terms,
        defaultNotes: company.default_notes,
        currency: company.currency,
      });
      setCompany(result);
      await refreshSettings();
      toast.success('Settings saved');
    } catch (error: any) { toast.error(error.message); }
    finally { setSaving(false); }
  };

  const update = (field: string, value: any) => setCompany({ ...company, [field]: value });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Accounting Settings</h1>
        <Button onClick={saveCompany} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 gap-2"><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}</Button>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList><TabsTrigger value="company">Company Info</TabsTrigger><TabsTrigger value="invoicing">Invoicing</TabsTrigger></TabsList>

        <TabsContent value="company" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-indigo-500" /> Company Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Company Name</Label><Input value={company.company_name || ''} onChange={e => update('company_name', e.target.value)} /></div>
                <div className="space-y-2"><Label>Tax ID / EIN</Label><Input value={company.tax_id || ''} onChange={e => update('tax_id', e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Address</Label><Input value={company.address || ''} onChange={e => update('address', e.target.value)} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>City</Label><Input value={company.city || ''} onChange={e => update('city', e.target.value)} /></div>
                <div className="space-y-2"><Label>State</Label><Input value={company.state || ''} onChange={e => update('state', e.target.value)} /></div>
                <div className="space-y-2"><Label>ZIP</Label><Input value={company.zip || ''} onChange={e => update('zip', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={company.phone || ''} onChange={e => update('phone', e.target.value)} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={company.email || ''} onChange={e => update('email', e.target.value)} /></div>
                <div className="space-y-2"><Label>Website</Label><Input value={company.website || ''} onChange={e => update('website', e.target.value)} /></div>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={company.currency || 'USD'} onValueChange={val => update('currency', val)}>
                  <SelectTrigger className="w-full sm:w-64 bg-white">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoicing" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-indigo-500" /> Invoice Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Invoice Prefix</Label><Input value={company.invoice_prefix || 'INV-'} onChange={e => update('invoice_prefix', e.target.value)} /></div>
                <div className="space-y-2"><Label>Next Invoice #</Label><Input type="number" value={company.invoice_next_number || 1001} onChange={e => update('invoice_next_number', Number(e.target.value))} /></div>
                <div className="space-y-2"><Label>Payment Terms (days)</Label><Input type="number" value={company.payment_terms || 30} onChange={e => update('payment_terms', Number(e.target.value))} /></div>
              </div>
              <div className="space-y-2"><Label>Default Invoice Notes</Label><Input value={company.default_notes || ''} onChange={e => update('default_notes', e.target.value)} placeholder="Thank you for your business!" /></div>
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-sm text-indigo-700 mb-2">Preview</h4>
                <p className="text-sm text-indigo-600">Your next invoice will be: <strong>{company.invoice_prefix || 'INV-'}{company.invoice_next_number || 1001}</strong></p>
                <p className="text-sm text-indigo-600 mt-1">Default payment terms: <strong>Net {company.payment_terms || 30}</strong></p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingSettings;
