import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Building2, CreditCard, FileCheck } from 'lucide-react';
import { api, ICompany } from '../api/client';

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [form, setForm] = useState<ICompany>({
    name: 'ShortCircuit',
    tagline: 'Robotics, Electronics & Innovation Lab',
    address: 'Shop No. 12, Ground Floor, Electronics Market',
    city: 'Gorakhpur',
    state: 'Uttar Pradesh',
    stateCode: '09',
    pincode: '273010',
    phone: '+91 98765 43210',
    email: 'sales@shortcircuit.in',
    website: 'www.shortcircuit.in',
    gstin: '09AAACE1234F1Z5',
    pan: 'AAACE1234F',
    bankName: 'State Bank of India',
    accountNo: '39485720194',
    ifsc: 'SBIN0001234',
    branch: 'MMMUT Branch, Gorakhpur',
    upiId: 'shortcircuit@sbi',
    defaultPrefix: 'SC/2026/',
    defaultTerms: [
      'Warranty as per manufacturer terms and conditions.',
      'Goods once sold will not be taken back or exchanged.',
      'Subject to Gorakhpur jurisdiction only.',
    ],
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await api.get('/company');
      if (res.data.company) {
        setForm(res.data.company);
      }
    } catch (err) {
      console.error('Failed to load company profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setSavedSuccess(false);
      await api.put('/company', form);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update company settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTermChange = (index: number, val: string) => {
    const updated = [...(form.defaultTerms || [])];
    updated[index] = val;
    setForm({ ...form, defaultTerms: updated });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Billing Settings & Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Configure company details, bank info, and default invoice settings.</p>
        </div>
        {savedSuccess && (
          <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Identity */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm border-b border-slate-100 pb-2">
            <Building2 className="w-4 h-4" />
            <span>Company Profile (Billed By)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Store Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={form.tagline || ''}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">State Code</label>
              <input
                type="text"
                value={form.stateCode}
                onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="text"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN</label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono uppercase font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">PAN</label>
              <input
                type="text"
                value={form.pan}
                onChange={(e) => setForm({ ...form, pan: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Bank & UPI Information */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm border-b border-slate-100 pb-2">
            <CreditCard className="w-4 h-4" />
            <span>Bank & UPI Details (Printed on Invoices)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number</label>
              <input
                type="text"
                value={form.accountNo}
                onChange={(e) => setForm({ ...form, accountNo: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">IFSC Code</label>
              <input
                type="text"
                value={form.ifsc}
                onChange={(e) => setForm({ ...form, ifsc: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Branch Name</label>
              <input
                type="text"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">UPI ID (e.g. VPA)</label>
              <input
                type="text"
                value={form.upiId || ''}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                placeholder="engineersbuy@sbi"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono text-blue-900 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Invoice Defaults & Terms */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-blue-900 font-bold text-sm border-b border-slate-100 pb-2">
            <FileCheck className="w-4 h-4" />
            <span>Invoice Number Prefix & Default Terms</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Invoice Prefix (Used for auto-sequencing)
            </label>
            <input
              type="text"
              value={form.defaultPrefix}
              onChange={(e) => setForm({ ...form, defaultPrefix: e.target.value })}
              className="w-full sm:w-64 px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono font-bold"
            />
            <p className="text-[11px] text-slate-400 mt-1">Example: `EB/2026/` results in `EB/2026/81`, `EB/2026/82`, etc.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Default Terms & Conditions</label>
            {(form.defaultTerms || []).map((term, i) => (
              <input
                key={i}
                type="text"
                value={term}
                onChange={(e) => handleTermChange(i, e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition transform active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
