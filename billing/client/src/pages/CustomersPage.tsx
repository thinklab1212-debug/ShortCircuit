import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit2, Users, Building, Phone, Mail, MapPin } from 'lucide-react';
import { api, ICustomer } from '../api/client';
import { Modal } from '../components/Modal';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ICustomer | null>(null);
  const [form, setForm] = useState<Partial<ICustomer>>({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Uttar Pradesh',
    stateCode: '09',
    pincode: '',
    gstin: '',
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers', { params: { search: search.trim() } });
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setForm({
      name: '',
      companyName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: 'Uttar Pradesh',
      stateCode: '09',
      pincode: '',
      gstin: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: ICustomer) => {
    setEditingCustomer(customer);
    setForm({ ...customer });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address) {
      alert('Name and Address are required.');
      return;
    }

    try {
      if (editingCustomer?._id) {
        const res = await api.put(`/customers/${editingCustomer._id}`, form);
        setCustomers((prev) =>
          prev.map((c) => (c._id === editingCustomer._id ? res.data.customer : c))
        );
      } else {
        const res = await api.post('/customers', form);
        setCustomers((prev) => [res.data.customer, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save customer');
    }
  };

  const handleDelete = async (customer: ICustomer) => {
    if (!window.confirm(`Delete customer ${customer.name}?`)) return;
    try {
      await api.delete(`/customers/${customer._id}`);
      setCustomers((prev) => prev.filter((c) => c._id !== customer._id));
    } catch (err) {
      alert('Failed to delete customer');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your regular clients, institutions, and state codes.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {customers.length} total registered
        </span>
      </div>

      {/* Grid of Customers */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Customers Added</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Save regular customers to auto-populate invoices in 1 click.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((c) => (
            <div key={c._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 hover:border-blue-200 transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                  {c.companyName && (
                    <p className="text-xs text-blue-900 font-medium mt-0.5">{c.companyName}</p>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1 text-slate-400 hover:text-blue-900 hover:bg-slate-100 rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{c.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {c.state} ({c.stateCode || '09'})
                  </span>
                  {c.gstin && (
                    <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded">
                      GST: {c.gstin}
                    </span>
                  )}
                </div>
                {(c.phone || c.email) && (
                  <div className="flex items-center space-x-3 text-slate-500 pt-1">
                    {c.phone && <span>📞 {c.phone}</span>}
                    {c.email && <span className="truncate">✉️ {c.email}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Entity Name *</label>
              <input
                type="text"
                required
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Organization / College</label>
              <input
                type="text"
                value={form.companyName || ''}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
            <textarea
              required
              rows={2}
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={form.state || 'Uttar Pradesh'}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State Code</label>
              <input
                type="text"
                value={form.stateCode || '09'}
                onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
              <input
                type="text"
                value={form.gstin || ''}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg uppercase font-mono"
              />
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
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
