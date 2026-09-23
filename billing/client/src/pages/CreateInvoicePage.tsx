import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, UserPlus, CheckCircle2, FileDown, Eye, AlertCircle } from 'lucide-react';
import { api, ICustomer, IProduct, IInvoice } from '../api/client';
import { Modal } from '../components/Modal';

interface CreateInvoicePageProps {
  onInvoiceCreated: (invoice: IInvoice, downloadNow?: boolean) => void;
  onCancel: () => void;
}

interface LineItemState {
  name: string;
  description: string;
  isKit?: boolean;
  kitItemsText?: string;
  showKitBreakdown?: boolean;
  hsn: string;
  qty: number;
  unit: string;
  unitPrice: number;
  discount: number;
  gstRate: number;
}

export const CreateInvoicePage: React.FC<CreateInvoicePageProps> = ({ onInvoiceCreated, onCancel }) => {
  // Metadata state
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  });
  const [dueDate, setDueDate] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('Uttar Pradesh (09)');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID' | 'PARTIAL'>('PAID');
  const [paymentReference, setPaymentReference] = useState('');

  // Customer state
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customer, setCustomer] = useState<ICustomer>({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Uttar Pradesh',
    stateCode: '09',
    gstin: '',
  });

  // Products catalog
  const [products, setProducts] = useState<IProduct[]>([]);

  // Items in invoice
  const [items, setItems] = useState<LineItemState[]>([
    {
      name: '',
      description: '',
      hsn: '8542',
      qty: 1,
      unit: 'NOS',
      unitPrice: 0,
      discount: 0,
      gstRate: 18,
    },
  ]);

  // Loading & Modals
  const [loading, setLoading] = useState(false);
  const [fetchingNextNo, setFetchingNextNo] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // New customer modal form state
  const [newCustForm, setNewCustForm] = useState<Partial<ICustomer>>({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Uttar Pradesh',
    stateCode: '09',
    gstin: '',
  });

  // Load initial catalog & next invoice number
  useEffect(() => {
    fetchNextInvoiceNo();
    loadCustomers();
    loadProducts();
  }, []);

  const fetchNextInvoiceNo = async () => {
    try {
      setFetchingNextNo(true);
      const res = await api.get('/invoices/next-number');
      if (res.data?.suggestedInvoiceNo) {
        setInvoiceNo(res.data.suggestedInvoiceNo);
      }
    } catch (err) {
      console.error('Error fetching next number:', err);
    } finally {
      setFetchingNextNo(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    const found = customers.find((c) => c._id === id);
    if (found) {
      setCustomer({ ...found });
      setPlaceOfSupply(`${found.state} (${found.stateCode || '09'})`);
    }
  };

  const handleSaveNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustForm.name || !newCustForm.address) {
      alert('Customer Name and Address are required.');
      return;
    }
    try {
      const res = await api.post('/customers', newCustForm);
      const created = res.data.customer;
      setCustomers((prev) => [...prev, created]);
      setSelectedCustomerId(created._id);
      setCustomer({ ...created });
      setPlaceOfSupply(`${created.state} (${created.stateCode || '09'})`);
      setShowAddCustomerModal(false);
      setNewCustForm({
        name: '',
        companyName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: 'Uttar Pradesh',
        stateCode: '09',
        gstin: '',
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save customer');
    }
  };

  // Line Items manipulation
  const handleItemChange = (index: number, field: keyof LineItemState, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleCatalogProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p._id === productId);
    if (!prod) return;
    const hasPkg = Array.isArray(prod.packageContents) && prod.packageContents.length > 0;
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        name: prod.name,
        description: prod.description || '',
        hsn: prod.hsn || '8542',
        unit: prod.unit || (hasPkg ? 'SET' : 'NOS'),
        unitPrice: prod.unitPrice || 0,
        gstRate: prod.gstRate ?? 18,
        isKit: Boolean(prod.isKit || hasPkg),
        kitItemsText: hasPkg ? prod.packageContents!.join('\n') : (updated[index].kitItemsText || ''),
        showKitBreakdown: Boolean(hasPkg || updated[index].showKitBreakdown),
      };
      return updated;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        hsn: '8542',
        qty: 1,
        unit: 'NOS',
        unitPrice: 0,
        discount: 0,
        gstRate: 18,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Tax and Total Calculations
  const isIntraState = (customer.stateCode || '09').trim() === '09';

  let subtotal = 0;
  let totalDiscount = 0;
  let taxableSubtotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  items.forEach((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.unitPrice) || 0;
    const disc = Number(item.discount) || 0;
    const gst = Number(item.gstRate) || 0;

    const base = qty * rate;
    const taxable = Math.max(0, base - disc);

    subtotal += base;
    totalDiscount += disc;
    taxableSubtotal += taxable;

    if (gst > 0) {
      if (isIntraState) {
        cgstTotal += (taxable * (gst / 2)) / 100;
        sgstTotal += (taxable * (gst / 2)) / 100;
      } else {
        igstTotal += (taxable * gst) / 100;
      }
    }
  });

  const rawGrandTotal = taxableSubtotal + cgstTotal + sgstTotal + igstTotal;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Math.round((grandTotal - rawGrandTotal) * 100) / 100;

  // Submit invoice
  const handleSubmit = async (downloadImmediately: boolean = false) => {
    setErrorMsg('');
    if (!invoiceNo.trim()) {
      setErrorMsg('Please enter an Invoice Number.');
      return;
    }
    if (!customer.name.trim() || !customer.address.trim()) {
      setErrorMsg('Please enter or select customer Name and Address.');
      return;
    }
    const hasValidItem = items.some((it) => it.name.trim() && it.qty > 0);
    if (!hasValidItem) {
      setErrorMsg('Please specify at least one valid line item with description and quantity.');
      return;
    }

    try {
      setLoading(true);
      const computedItems = items.map((it) => ({
        name: it.name,
        description: it.description || '',
        isKit: Boolean(it.isKit || (it.kitItemsText && it.kitItemsText.trim().length > 0)),
        kitItems: it.kitItemsText
          ? it.kitItemsText.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
        hsn: it.hsn,
        qty: it.qty,
        unit: it.unit,
        unitPrice: it.unitPrice,
        discount: it.discount,
        gstRate: it.gstRate,
      }));

      const payload = {
        invoiceNo: invoiceNo.trim(),
        invoiceDate,
        dueDate,
        placeOfSupply,
        paymentMode,
        paymentStatus,
        paymentReference,
        customer,
        items: computedItems,
      };

      const res = await api.post('/invoices', payload);
      onInvoiceCreated(res.data.invoice, downloadImmediately);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Tax Invoice</h1>
          <p className="text-sm text-slate-500 mt-1">
            Fill in the details below. Invoice number is fully editable or auto-suggested.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(false)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-lg transition"
          >
            <Eye className="w-4 h-4" />
            <span>Save & View</span>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="flex items-center space-x-2 px-5 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition transform active:scale-95 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{loading ? 'Generating...' : 'Save & Download PDF'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Invoice Meta & Customer Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Metadata (Column 1) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Invoice Details</h2>
            <button
              type="button"
              onClick={fetchNextInvoiceNo}
              disabled={fetchingNextNo}
              className="text-xs text-blue-700 hover:text-blue-900 flex items-center space-x-1 font-semibold"
              title="Auto-fill next sequential invoice number"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingNextNo ? 'animate-spin' : ''}`} />
              <span>Auto Next</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Invoice Number <span className="text-blue-700">(Editable)</span> *
            </label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="e.g. EB/2026/81"
              className="w-full px-3 py-2 text-sm font-mono font-bold bg-blue-50/50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">You can freely edit or override this number.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Date *</label>
              <input
                type="text"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                placeholder="23 Sep 2026"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-semibold text-slate-800"
              >
                <option value="PAID">PAID</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PARTIAL">PARTIAL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-800"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Place of Supply</label>
            <input
              type="text"
              value={placeOfSupply}
              onChange={(e) => setPlaceOfSupply(e.target.value)}
              placeholder="Uttar Pradesh (09)"
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Customer Information (Columns 2 & 3) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Customer / Buyer Details</h2>
            <div className="flex items-center space-x-2">
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Select Saved Customer --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                className="flex items-center space-x-1 text-xs px-2.5 py-1.5 bg-blue-50 text-blue-900 font-semibold rounded-lg hover:bg-blue-100 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ New</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Entity Name *</label>
              <input
                type="text"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder="e.g. IEEE STB MMMUT or Mr. Rajesh Kumar"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Company / College</label>
              <input
                type="text"
                value={customer.companyName || ''}
                onChange={(e) => setCustomer({ ...customer, companyName: e.target.value })}
                placeholder="e.g. Madan Mohan Malaviya University of Tech"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address *</label>
            <textarea
              rows={2}
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              placeholder="Full physical address"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
              <input
                type="text"
                value={customer.phone || ''}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                placeholder="+91..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={customer.email || ''}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                placeholder="contact@..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
              <input
                type="text"
                value={customer.state}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomer({ ...customer, state: val });
                  setPlaceOfSupply(`${val} (${customer.stateCode || '09'})`);
                }}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">State Code</label>
              <input
                type="text"
                value={customer.stateCode}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomer({ ...customer, stateCode: val });
                  setPlaceOfSupply(`${customer.state} (${val})`);
                }}
                placeholder="09"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                value={customer.gstin || ''}
                onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })}
                placeholder="09AAACE1234F1Z5"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tax Calculation</label>
              <div className="mt-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                {isIntraState ? (
                  <span className="text-emerald-700 font-bold">Intra-State: CGST (50%) + SGST (50%)</span>
                ) : (
                  <span className="text-blue-700 font-bold">Inter-State: IGST (100%)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Line Items</h2>
            <p className="text-xs text-slate-500">Pick from products catalog or type custom items freely.</p>
          </div>
          <button
            type="button"
            onClick={addItemRow}
            className="flex items-center space-x-1.5 text-xs px-3 py-1.5 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 min-w-[220px]">Item Description</th>
                <th className="py-3 px-2 w-24 text-center">Catalog Pick</th>
                <th className="py-3 px-2 w-20 text-center">HSN/SAC</th>
                <th className="py-3 px-2 w-16 text-center">Qty</th>
                <th className="py-3 px-2 w-16 text-center">Unit</th>
                <th className="py-3 px-2 w-24 text-right">Price (Rs.)</th>
                <th className="py-3 px-2 w-20 text-right">Disc (Rs.)</th>
                <th className="py-3 px-2 w-20 text-center">GST %</th>
                <th className="py-3 px-3 w-28 text-right">Total (Rs.)</th>
                <th className="py-3 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => {
                const lineBase = item.qty * item.unitPrice;
                const lineTaxable = Math.max(0, lineBase - item.discount);
                const lineGst = (lineTaxable * item.gstRate) / 100;
                const lineTotal = lineTaxable + lineGst;

                return (
                  <tr key={index} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-semibold">{index + 1}</td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="e.g. Arduino Uno R3 or Custom IoT Project Kit"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none text-xs font-semibold text-slate-800"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'showKitBreakdown', !item.showKitBreakdown)}
                          className="text-[10px] text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1"
                        >
                          <span>{item.showKitBreakdown ? '▲ Hide Kit Breakdown' : '📦 + Kit / Items Breakdown'}</span>
                        </button>
                        {item.kitItemsText && (
                          <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                            {item.kitItemsText.split('\n').filter(Boolean).length} kit items
                          </span>
                        )}
                      </div>

                      {item.showKitBreakdown && (
                        <div className="mt-2 p-2 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-blue-900">
                            <span>Items in this Kit (Printed on Invoice):</span>
                            <span className="text-[9px] text-slate-500 font-normal">One item per line</span>
                          </div>
                          <textarea
                            rows={3}
                            value={item.kitItemsText || ''}
                            onChange={(e) => handleItemChange(index, 'kitItemsText', e.target.value)}
                            placeholder={"1x Arduino Uno R3 DIP\n1x ESP8266 NodeMCU Wi-Fi\n1x 16x2 I2C Display\n1x Ultrasonic Sensor HC-SR04"}
                            className="w-full text-[11px] font-mono p-1.5 bg-white border border-blue-200 rounded focus:ring-1 focus:ring-blue-600 focus:outline-none"
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <select
                        onChange={(e) => handleCatalogProductSelect(index, e.target.value)}
                        defaultValue=""
                        className="w-full text-[11px] px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none"
                      >
                        <option value="" disabled>Catalog...</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={item.hsn}
                        onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                        placeholder="8542"
                        className="w-full text-center px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                        className="w-full text-center px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-full text-center px-1 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px]"
                      >
                        <option value="NOS">NOS</option>
                        <option value="PCS">PCS</option>
                        <option value="SET">SET</option>
                        <option value="MTR">MTR</option>
                        <option value="KG">KG</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                        className="w-full text-right px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, 'discount', Number(e.target.value))}
                        className="w-full text-right px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-red-600"
                      />
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <select
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(index, 'gstRate', Number(e.target.value))}
                        className="w-full text-center px-1 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                      Rs. {lineTotal.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        disabled={items.length === 1}
                        className="p-1 text-slate-400 hover:text-red-600 rounded disabled:opacity-30 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Summary & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Side: Notes & Terms Preview */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Invoice Terms & Bank Snapshot</h3>
          <p className="text-xs text-slate-600">
            • Bank details and company terms configured in <span className="font-semibold text-blue-900">Settings</span> are automatically rendered on the PDF.
          </p>
          <p className="text-xs text-slate-600">
            • Taxes will be computed automatically as <span className="font-semibold text-blue-900">{isIntraState ? 'CGST & SGST (9% + 9%)' : 'IGST (18%)'}</span> based on customer state code.
          </p>
        </div>

        {/* Right Side: Financial Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
            <span>Subtotal (Base)</span>
            <span className="font-mono font-semibold">Rs. {subtotal.toFixed(2)}</span>
          </div>

          {totalDiscount > 0 && (
            <div className="flex justify-between text-xs text-red-600 pb-2 border-b border-slate-100">
              <span>Total Discount</span>
              <span className="font-mono font-semibold">-Rs. {totalDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs text-slate-700 font-semibold pb-2 border-b border-slate-100">
            <span>Taxable Subtotal</span>
            <span className="font-mono">Rs. {taxableSubtotal.toFixed(2)}</span>
          </div>

          {isIntraState ? (
            <>
              <div className="flex justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
                <span>Central GST (CGST)</span>
                <span className="font-mono font-semibold">Rs. {cgstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
                <span>State GST (SGST)</span>
                <span className="font-mono font-semibold">Rs. {sgstTotal.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
              <span>Integrated GST (IGST)</span>
              <span className="font-mono font-semibold">Rs. {igstTotal.toFixed(2)}</span>
            </div>
          )}

          {roundOff !== 0 && (
            <div className="flex justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span>Round Off</span>
              <span className="font-mono">{roundOff >= 0 ? `+Rs. ${roundOff.toFixed(2)}` : `-Rs. ${Math.abs(roundOff).toFixed(2)}`}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-3 bg-blue-900 text-white px-4 rounded-lg shadow-sm">
            <span className="font-bold text-sm">GRAND TOTAL</span>
            <span className="font-extrabold text-lg font-mono">Rs. {grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      <Modal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title="Add New Customer"
      >
        <form onSubmit={handleSaveNewCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={newCustForm.name || ''}
                onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
              <input
                type="text"
                value={newCustForm.companyName || ''}
                onChange={(e) => setNewCustForm({ ...newCustForm, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
            <textarea
              required
              rows={2}
              value={newCustForm.address || ''}
              onChange={(e) => setNewCustForm({ ...newCustForm, address: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={newCustForm.phone || ''}
                onChange={(e) => setNewCustForm({ ...newCustForm, phone: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={newCustForm.email || ''}
                onChange={(e) => setNewCustForm({ ...newCustForm, email: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={newCustForm.state || 'Uttar Pradesh'}
                onChange={(e) => setNewCustForm({ ...newCustForm, state: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State Code</label>
              <input
                type="text"
                value={newCustForm.stateCode || '09'}
                onChange={(e) => setNewCustForm({ ...newCustForm, stateCode: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
              <input
                type="text"
                value={newCustForm.gstin || ''}
                onChange={(e) => setNewCustForm({ ...newCustForm, gstin: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg uppercase font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddCustomerModal(false)}
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
