import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit2, Package, Tag, Percent, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api, IProduct } from '../api/client';
import { Modal } from '../components/Modal';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [form, setForm] = useState<Partial<IProduct>>({
    name: '',
    sku: '',
    description: '',
    hsn: '8542',
    unit: 'NOS',
    unitPrice: 0,
    gstRate: 18,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products', { params: { search: search.trim() } });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSyncFromStore = async () => {
    try {
      setSyncing(true);
      setSyncFeedback(null);
      const res = await api.post('/products/sync-store');
      setSyncFeedback(res.data.message || 'Synced components from ShortCircuit store!');
      await fetchProducts();
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Store sync failed. Ensure store Atlas IP is accessible.');
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      sku: '',
      description: '',
      hsn: '8542',
      unit: 'NOS',
      unitPrice: 0,
      gstRate: 18,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: IProduct) => {
    setEditingProduct(product);
    setForm({ ...product });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      alert('Product name is required.');
      return;
    }

    try {
      if (editingProduct?._id) {
        const res = await api.put(`/products/${editingProduct._id}`, form);
        setProducts((prev) =>
          prev.map((p) => (p._id === editingProduct._id ? res.data.product : p))
        );
      } else {
        const res = await api.post('/products', form);
        setProducts((prev) => [res.data.product, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save product');
    }
  };

  const handleDelete = async (product: IProduct) => {
    if (!window.confirm(`Delete product ${product.name}?`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Products & Services Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">Pre-configure items or auto-sync directly from ShortCircuit Store.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSyncFromStore}
            disabled={syncing}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-sm transition disabled:opacity-50"
            title="Auto-fetch new products and updated prices from ShortCircuit store"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync from Store'}</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search items, HSN, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {products.length} catalog items
        </span>
      </div>

      {/* Table of Products */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No Items In Catalog</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add commonly invoiced products, electronic kits, or sensors here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4 text-center">HSN/SAC</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-right">Default Rate (Rs.)</th>
                  <th className="py-3 px-4 text-center">GST Rate</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      {p.description && <div className="text-[11px] text-slate-500">{p.description}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {p.sku || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                      {p.hsn || '-'}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {p.unit || 'NOS'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-900">
                      Rs. {p.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800">
                        {p.gstRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-blue-900 hover:bg-slate-100 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item / Service Name *</label>
            <input
              type="text"
              required
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Part No.</label>
              <input
                type="text"
                value={form.sku || ''}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HSN / SAC Code</label>
              <input
                type="text"
                value={form.hsn || '8542'}
                onChange={(e) => setForm({ ...form, hsn: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
              <select
                value={form.unit || 'NOS'}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              >
                <option value="NOS">NOS</option>
                <option value="PCS">PCS</option>
                <option value="SET">SET</option>
                <option value="MTR">MTR</option>
                <option value="KG">KG</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (Rs.)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.unitPrice || 0}
                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate</label>
              <select
                value={form.gstRate ?? 18}
                onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
