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

      {/* Company Branding: Logo & Stamp Upload */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Official Branding & Signature Stamp
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload custom company logo and round stamp. These appear directly on all generated PDF invoices.
          </p>
        </div>

        <BrandingUploadSection
          currentLogo={form.logoPath || '/logo.png'}
          currentStamp={form.stampPath || '/stamp.png'}
          onAssetsUpdated={(updatedCompany) => {
            setForm((prev) => ({ ...prev, ...updatedCompany }));
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
          }}
        />
      </div>

      {/* Security: Change Admin Password */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Security & Admin Password
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Change your billing portal access password.
          </p>
        </div>
        <ChangePasswordSection />
      </div>
    </div>
  );
};

// ---------------- Branding Upload Subcomponent ----------------
interface BrandingUploadSectionProps {
  currentLogo: string;
  currentStamp: string;
  onAssetsUpdated: (company: Partial<ICompany>) => void;
}

const BrandingUploadSection: React.FC<BrandingUploadSectionProps> = ({
  currentLogo,
  currentStamp,
  onAssetsUpdated,
}) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setLogoFile(f);
      setLogoPreview(URL.createObjectURL(f));
    }
  };

  const handleStampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setStampFile(f);
      setStampPreview(URL.createObjectURL(f));
    }
  };

  const handleUpload = async () => {
    if (!logoFile && !stampFile) {
      setMsg({ text: 'Please select a new Logo or Stamp image first.', error: true });
      return;
    }

    try {
      setUploading(true);
      setMsg(null);
      const fd = new FormData();
      if (logoFile) fd.append('logo', logoFile);
      if (stampFile) fd.append('stamp', stampFile);

      const res = await api.post('/company/upload-assets', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setMsg({ text: 'Branding assets updated successfully! PDF invoices will use these immediately.' });
        onAssetsUpdated(res.data.company);
        setLogoFile(null);
        setStampFile(null);
      }
    } catch (err: any) {
      setMsg({ text: err.response?.data?.error || 'Failed to upload assets', error: true });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {msg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
            msg.error ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Company Logo Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Company Logo</span>
            <span className="text-[10px] text-slate-400">PNG / JPEG (Max 5MB)</span>
          </div>

          <div className="h-24 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-2 overflow-hidden shadow-inner">
            <img
              src={logoPreview || (currentLogo.startsWith('http') ? currentLogo : `http://localhost:5050${currentLogo}`)}
              alt="Logo Preview"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                // fallback to /logo.png
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Choose New Logo Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
        </div>

        {/* Authorized Stamp Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Authorized Stamp</span>
            <span className="text-[10px] text-slate-400">Transparent PNG recommended</span>
          </div>

          <div className="h-24 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-2 overflow-hidden shadow-inner">
            <img
              src={stampPreview || (currentStamp.startsWith('http') ? currentStamp : `http://localhost:5050${currentStamp}`)}
              alt="Stamp Preview"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                // fallback to /stamp.png
                (e.target as HTMLImageElement).src = '/stamp.png';
              }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Choose New Stamp / Signature Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleStampChange}
              className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || (!logoFile && !stampFile)}
          className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition transform active:scale-95 disabled:opacity-50"
        >
          {uploading ? 'Uploading Images...' : 'Upload & Save Branding'}
        </button>
      </div>
    </div>
  );
};

// ---------------- Change Password Subcomponent ----------------
const ChangePasswordSection: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setMsg({ text: 'Please fill in all password fields', error: true });
      return;
    }
    if (newPassword.length < 6) {
      setMsg({ text: 'New password must be at least 6 characters long', error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ text: 'New password and confirmation do not match', error: true });
      return;
    }

    try {
      setLoading(true);
      setMsg(null);
      const res = await api.put('/auth/change-password', { currentPassword, newPassword });
      setMsg({ text: res.data.message || 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMsg({ text: err.response?.data?.error || 'Failed to change password', error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {msg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold ${
            msg.error ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password *</label>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••••••"
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
        <input
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimum 6 characters"
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat new password"
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition transform active:scale-95 disabled:opacity-50"
      >
        {loading ? 'Updating Password...' : 'Update Password'}
      </button>
    </form>
  );
};
