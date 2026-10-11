import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { toast } from 'sonner';

const titles: Record<string, string> = {
  'ins-clients': 'Clients',
  'ins-policies': 'Policies',
  'ins-leads': 'Leads',
  'ins-products': 'Insurance products',
  'ins-commissions': 'Commission rates',
  'ins-cashbook': 'Cashbook',
};

export default function InsuranceDesk({ section }: { section: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const endpoint =
    section === 'ins-clients' ? '/insurance/clients' :
    section === 'ins-policies' ? '/insurance/policies' :
    section === 'ins-leads' ? '/insurance/leads' :
    section === 'ins-products' ? '/insurance/products' :
    section === 'ins-commissions' ? '/insurance/commissions' :
    '/insurance/cashbook';

  const load = () => {
    setLoading(true);
    api.get(endpoint).then(setRows).catch((error: Error) => toast.error(error.message)).finally(() => setLoading(false));
  };

  useEffect(() => { setForm({}); load(); }, [section]);

  const fields =
    section === 'ins-clients' ? ['name', 'email', 'phone', 'address'] :
    section === 'ins-policies' ? ['policy_number', 'insurance_type', 'start_date', 'expiry_date', 'premium', 'commission_percent', 'insurance_company'] :
    section === 'ins-leads' ? ['name', 'email', 'phone', 'source'] :
    section === 'ins-products' ? ['insurance_type', 'class_of_business', 'description', 'commission_rate'] :
    section === 'ins-commissions' ? ['class_of_business', 'agreed_rate'] :
    ['description', 'amount', 'type', 'category'];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post(endpoint, form);
      toast.success('Saved');
      setForm({});
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const remove = async (id: number) => {
    if (section === 'ins-products' || section === 'ins-commissions' || section === 'ins-cashbook') return;
    try {
      await api.delete(`${endpoint}/${id}`);
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const columns = rows[0] ? Object.keys(rows[0]).filter((key) => !['communication_history', 'updated_at'].includes(key)).slice(0, 6) : fields;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{titles[section] || 'Insurance'}</h1>
        <p className="text-sm text-slate-500">These records stay on your existing insurance tables.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Add</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field} className="space-y-1">
                <Label className="capitalize">{field.replaceAll('_', ' ')}</Label>
                <Input
                  type={field.includes('date') ? 'date' : field.match(/premium|rate|amount|percent/) ? 'number' : 'text'}
                  value={form[field] || ''}
                  onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                  required={['name', 'email', 'policy_number', 'insurance_type', 'class_of_business', 'amount', 'type', 'start_date', 'expiry_date', 'agreed_rate'].includes(field)}
                />
              </div>
            ))}
            <div className="md:col-span-2"><Button type="submit">Save</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>{columns.map((column) => <TableHead key={column}>{column}</TableHead>)}<TableHead /></TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={columns.length + 1}>Loading...</TableCell></TableRow> :
                rows.length === 0 ? <TableRow><TableCell colSpan={columns.length + 1}>Nothing here yet.</TableCell></TableRow> :
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((column) => <TableCell key={column}>{String(row[column] ?? '')}</TableCell>)}
                    <TableCell>
                      {row.id && !['ins-products', 'ins-commissions', 'ins-cashbook'].includes(section) && (
                        <Button variant="ghost" onClick={() => remove(row.id)}>Delete</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
