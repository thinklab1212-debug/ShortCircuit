import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, CheckCircle2, Clock, Trash2, PlusCircle, RefreshCw, FileText, Mail, Send, Paperclip } from 'lucide-react';
import { api, IInvoice, API_BASE } from '../api/client';
import { Modal } from '../components/Modal';

interface InvoicesPageProps {
  onCreateClick: () => void;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({ onCreateClick }) => {
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL'>('ALL');

  // Preview modal
  const [previewInvoice, setPreviewInvoice] = useState<IInvoice | null>(null);

  // Email modal state
  const [emailingInvoice, setEmailingInvoice] = useState<IInvoice | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/invoices', { params });
      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleStatusToggle = async (invoice: IInvoice) => {
    const nextStatus = invoice.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    try {
      await api.patch(`/invoices/${invoice._id}/payment`, {
        status: nextStatus,
      });
      setInvoices((prev) =>
        prev.map((inv) => (inv._id === invoice._id ? { ...inv, paymentStatus: nextStatus } : inv))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleOpenEmailModal = (invoice: IInvoice) => {
    setEmailingInvoice(invoice);
    setEmailRecipient(invoice.customer.email || '');
    setEmailSubject(`Tax Invoice ${invoice.invoiceNo} from ShortCircuit`);
    setEmailMessage(
      `Dear ${invoice.customer.name},\n\n` +
      `Thank you for your business with ShortCircuit! Please find attached your Tax Invoice ${invoice.invoiceNo} for Rs. ${invoice.grandTotal.toFixed(2)} (${invoice.paymentStatus}).\n\n` +
      `Invoice Summary:\n` +
      `• Invoice No: ${invoice.invoiceNo}\n` +
      `• Date: ${invoice.invoiceDate}\n` +
      `• Amount: Rs. ${invoice.grandTotal.toFixed(2)}\n\n` +
      `If you have any questions or need technical support, please feel free to reply to this email.\n\n` +
      `Warm regards,\n` +
      `ShortCircuit Instruments & Robotics Lab\n` +
      `sales@shortcircuit.in`
    );
    setEmailFeedback(null);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailingInvoice?._id) return;
    if (!emailRecipient.trim()) {
      alert('Please enter recipient email address.');
      return;
    }

    try {
      setSendingEmail(true);
      setEmailFeedback(null);

      const res = await api.post(`/invoices/${emailingInvoice._id}/email`, {
        to: emailRecipient.trim(),
        subject: emailSubject.trim(),
        message: emailMessage,
      });

      setEmailFeedback({ type: 'success', message: res.data.message || 'Invoice sent successfully!' });
      
      // Update local invoice state
      setInvoices((prev) =>
        prev.map((inv) =>
          inv._id === emailingInvoice._id
            ? { ...inv, emailedAt: new Date().toISOString(), lastEmailedTo: emailRecipient.trim() }
            : inv
        )
      );

      setTimeout(() => {
        setEmailingInvoice(null);
      }, 1500);
    } catch (err: any) {
      setEmailFeedback({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Failed to send email',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDelete = async (invoice: IInvoice) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNo}?`)) return;
    try {
      await api.delete(`/invoices/${invoice._id}`);
      setInvoices((prev) => prev.filter((i) => i._id !== invoice._id));
    } catch (err) {
      alert('Failed to delete invoice');
    }
  };

  // Metrics
  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalPaid = invoices.filter((i) => i.paymentStatus === 'PAID').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalUnpaid = totalBilled - totalPaid;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoices</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{invoices.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">Rs. {totalBilled.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
            ₹
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Received / Paid</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">Rs. {totalPaid.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending / Unpaid</p>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">Rs. {totalUnpaid.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search invoice #, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
          />
        </form>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto">
          {(['ALL', 'PAID', 'UNPAID', 'PARTIAL'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}

          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg ml-2"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No Invoices Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Get started by creating your first tax invoice with our easy form.
            </p>
            <button
              onClick={onCreateClick}
              className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Invoice</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Amount (Rs.)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {inv.invoiceDate}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{inv.customer.name}</div>
                      {inv.customer.companyName && (
                        <div className="text-[11px] text-slate-500">{inv.customer.companyName}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {inv.items.length} {inv.items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      Rs. {inv.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleStatusToggle(inv)}
                        title="Click to toggle status"
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : inv.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {inv.paymentStatus}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEmailModal(inv)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title={inv.emailedAt ? `Emailed to ${inv.lastEmailedTo}` : "Email Invoice to Customer"}
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
                          title="Preview PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={`${API_BASE}/invoices/${inv._id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(inv)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {inv.emailedAt && (
                        <div className="text-[10px] text-emerald-700 font-semibold text-right mt-0.5">
                          ✓ Emailed
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      {previewInvoice && (
        <Modal
          isOpen={Boolean(previewInvoice)}
          onClose={() => setPreviewInvoice(null)}
          title={`Invoice Preview: ${previewInvoice.invoiceNo}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs text-slate-500">
                Customer: <strong className="text-slate-800">{previewInvoice.customer.name}</strong> | Amount: <strong className="text-blue-900">Rs. {previewInvoice.grandTotal.toFixed(2)}</strong>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const inv = previewInvoice;
                    setPreviewInvoice(null);
                    handleOpenEmailModal(inv);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email to Customer</span>
                </button>
                <a
                  href={`${API_BASE}/invoices/${previewInvoice._id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>

            <iframe
              src={`${API_BASE}/invoices/${previewInvoice._id}/pdf#toolbar=1`}
              className="w-full h-[650px] rounded-lg border border-slate-200"
              title="PDF Invoice"
            />
          </div>
        </Modal>
      )}

      {/* Email Invoice Modal with Live Preview */}
      {emailingInvoice && (
        <Modal
          isOpen={Boolean(emailingInvoice)}
          onClose={() => setEmailingInvoice(null)}
          title={`Email Invoice: ${emailingInvoice.invoiceNo}`}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSendEmail} className="space-y-4">
            {emailFeedback && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold flex items-center space-x-2 ${
                  emailFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <span>{emailFeedback.message}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recipient Email Address *
              </label>
              <input
                type="email"
                required
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject Line *
              </label>
              <input
                type="text"
                required
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none font-semibold text-slate-800"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Email Message Body (Editable Draft)
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Includes company branding</span>
              </div>
              <textarea
                rows={8}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs font-sans border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Attachment Badge */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center space-x-2 text-xs text-slate-700">
                <Paperclip className="w-4 h-4 text-blue-900" />
                <span className="font-semibold text-blue-900">
                  Invoice-{emailingInvoice.invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf
                </span>
                <span className="text-slate-400 text-[11px]">(PDF Document Attached)</span>
              </div>
              <a
                href={`${API_BASE}/invoices/${emailingInvoice._id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-700 hover:underline font-semibold"
              >
                Preview
              </a>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEmailingInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingEmail}
                className="flex items-center space-x-2 px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingEmail ? 'Sending Email...' : 'Send Invoice Email'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
