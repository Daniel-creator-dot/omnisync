import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Trash2, Package, AlertTriangle, Eye, Info, DollarSign, BarChart3, Tag, FileText, Boxes } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useSettings } from '../../contexts/SettingsContext';
import { toast } from 'sonner';

const Inventory = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);
  const { currencySymbol } = useSettings();
  const [newProduct, setNewProduct] = useState({ sku: '', name: '', description: '', price: 0, cost: 0, stockLevel: 0, category: '' });

  const fetchData = async () => {
    try { const data = await api.get('/inventory/products'); setProducts(data); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/inventory/products', newProduct); toast.success('Product added'); setIsAddOpen(false); setNewProduct({ sku: '', name: '', description: '', price: 0, cost: 0, stockLevel: 0, category: '' }); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/inventory/products/${id}`); toast.success('Deleted'); fetchData(); }
    catch (error: any) { toast.error(error.message); }
  };

  const totalValue = products.reduce((s, p) => s + (parseFloat(p.price || 0) * parseInt(p.stock_level || 0)), 0);
  const lowStock = products.filter(p => parseInt(p.stock_level || 0) < 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Inventory</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 gap-2" />}><Plus className="h-4 w-4" /> Add Product</DialogTrigger>
          <DialogContent className="sm:max-w-[500px] w-[95vw]">
            <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>SKU</Label><Input value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} placeholder="PRD-001" /></div>
                <div className="space-y-2"><Label>Category</Label><Input value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>Name</Label><Input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Price ({currencySymbol})</Label><Input type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} /></div>
                <div className="space-y-2"><Label>Cost ({currencySymbol})</Label><Input type="number" step="0.01" value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: Number(e.target.value)})} /></div>
                <div className="space-y-2"><Label>Stock</Label><Input type="number" value={newProduct.stockLevel} onChange={e => setNewProduct({...newProduct, stockLevel: Number(e.target.value)})} /></div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600">Add Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-indigo-100 p-2 rounded-lg"><Package className="h-5 w-5 text-indigo-600" /></div><div><p className="text-xs text-slate-500">Total Products</p><p className="text-2xl font-bold">{products.length}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="bg-emerald-100 p-2 rounded-lg"><Package className="h-5 w-5 text-emerald-600" /></div><div><p className="text-xs text-slate-500">Total Value</p><p className="text-2xl font-bold text-emerald-600">{currencySymbol}{totalValue.toLocaleString(undefined, {minimumFractionDigits:2})}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${lowStock.length > 0 ? 'bg-rose-100' : 'bg-slate-100'}`}><AlertTriangle className={`h-5 w-5 ${lowStock.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} /></div><div><p className="text-xs text-slate-500">Low Stock</p><p className={`text-2xl font-bold ${lowStock.length > 0 ? 'text-rose-600' : ''}`}>{lowStock.length}</p></div></div></Card>
      </div>

      {/* Product Table */}
      <Card className="bg-white border-slate-200 overflow-hidden">
        <CardHeader><CardTitle>Products</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>SKU</TableHead><TableHead>Product</TableHead><TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Price</TableHead><TableHead className="hidden sm:table-cell">Cost</TableHead><TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-500">Loading...</TableCell></TableRow> :
                products.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-500">No products.</TableCell></TableRow> :
                products.map((p: any) => {
                  const stock = parseInt(p.stock_level || 0);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm text-slate-500">{p.sku}</TableCell>
                      <TableCell><div><p className="font-medium">{p.name}</p>{p.description && <p className="text-xs text-slate-400 truncate max-w-[200px]">{p.description}</p>}</div></TableCell>
                      <TableCell className="hidden md:table-cell"><Badge variant="outline">{p.category || '-'}</Badge></TableCell>
                      <TableCell className="font-medium">{currencySymbol}{parseFloat(p.price || 0).toFixed(2)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-slate-500">{currencySymbol}{parseFloat(p.cost || 0).toFixed(2)}</TableCell>
                      <TableCell><Badge className={stock < 10 ? 'bg-rose-100 text-rose-700' : stock < 25 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>{stock}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewingProduct(p)} title="View Detail">
                            <Eye className="h-4 w-4 text-indigo-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => deleteProduct(p.id)} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* View Product Details Modal */}
      <Dialog open={!!viewingProduct} onOpenChange={() => setViewingProduct(null)}>
        <DialogContent className="sm:max-w-[550px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900">
              <Package className="h-5 w-5 text-indigo-600" />
              Product Specification
            </DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-md">
                    <Boxes className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-indigo-900 leading-tight">{viewingProduct.name}</h3>
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest font-mono">{viewingProduct.sku || 'N/A'}</p>
                  </div>
                </div>
                <Badge className={parseInt(viewingProduct.stock_level || 0) < 10 ? 'bg-rose-500 text-white' : parseInt(viewingProduct.stock_level || 0) < 25 ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}>
                  {parseInt(viewingProduct.stock_level || 0)} IN STOCK
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-2xl bg-white shadow-sm flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Selling Price</span>
                  <p className="text-2xl font-black text-indigo-600">{currencySymbol}{parseFloat(viewingProduct.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 border rounded-2xl bg-slate-50 shadow-sm flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Cost</span>
                  <p className="text-2xl font-black text-slate-600">{currencySymbol}{parseFloat(viewingProduct.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="space-y-4 px-1">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-500"><Tag className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</p>
                    <p className="text-sm font-bold text-slate-700">{viewingProduct.category || 'Uncategorized'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-500"><FileText className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {viewingProduct.description || 'No detailed description provided for this product.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-slate-100 rounded-lg text-slate-500"><BarChart3 className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margin Analysis</p>
                    <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${Math.min(100, (parseFloat(viewingProduct.price || 0) - parseFloat(viewingProduct.cost || 0)) / parseFloat(viewingProduct.price || 1) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <p className="text-[10px] font-bold text-slate-400">Profit Margin</p>
                      <p className="text-[10px] font-black text-emerald-600 lowercase tracking-widest">
                        {Math.max(0, Math.round((parseFloat(viewingProduct.price || 0) - parseFloat(viewingProduct.cost || 0)) / parseFloat(viewingProduct.price || 1) * 100))}% GROSS
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {parseInt(viewingProduct.stock_level || 0) < 10 && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100 text-rose-700">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">Low Stock Warning</p>
                    <p className="text-xs font-bold font-medium opacity-80">Inventory is below critical threshold. Restock required immediately.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingProduct(null)} className="w-full sm:w-auto font-bold border-2 border-indigo-100 hover:bg-slate-50">Dismiss Detail</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
