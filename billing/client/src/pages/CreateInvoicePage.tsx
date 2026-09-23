import React, { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, UserPlus, CheckCircle2, FileDown, Eye, AlertCircle, Search, Package } from 'lucide-react';
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
  inclusivePrice: number; // Gross price from website / user input (incl. GST)
  unitPrice: number;      // Base taxable rate (excl. GST)
  manualTaxableValue?: number; // Optional manual override of line taxable value
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
  const [freightCharges, setFreightCharges] = useState<number>(0);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);

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
      hsn: '',
      qty: 1,
      unit: 'NOS',
      inclusivePrice: 0,
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

  // Quick bill item from catalog if selected from Products Page
  useEffect(() => {
    const quickItemStr = localStorage.getItem('shortcircuit_quick_bill_item');
    if (quickItemStr && products.length > 0) {
      try {
        const prod: IProduct = JSON.parse(quickItemStr);
        localStorage.removeItem('shortcircuit_quick_bill_item');
        applyProductToRow(0, prod);
      } catch {}
    }
  }, [products]);

  // Apply a selected product to a line item row
  const applyProductToRow = (index: number, prod: IProduct) => {
    const hasPkg = Array.isArray(prod.packageContents) && prod.packageContents.length > 0;
    const isKit = Boolean(prod.isKit || (hasPkg && prod.name.toLowerCase().includes('kit')));
    const gst = prod.gstRate ?? 18;
    const grossPrice = Number(prod.unitPrice) || 0;
    // Website price is inclusive of GST: taxableRate = grossPrice / (1 + gst / 100)
    const taxableRate = gst > 0 ? Math.round((grossPrice / (1 + gst / 100)) * 100) / 100 : grossPrice;

    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        name: prod.name,
        description: '',
        hsn: prod.hsn || updated[index].hsn || '',
        unit: prod.unit || (isKit ? 'SET' : 'NOS'),
        inclusivePrice: grossPrice,
        unitPrice: taxableRate,
        gstRate: gst,
        manualTaxableValue: undefined,
        isKit,
        kitItemsText: isKit && hasPkg ? prod.packageContents!.join('\n') : (isKit ? updated[index].kitItemsText || '' : ''),
      };
      return updated;
    });
    setActiveSuggestionIndex(null);
  };

  // Line Items manipulation
  const handleItemChange = (index: number, field: keyof LineItemState, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Change Inclusive Price (Website Price) -> automatically recalculates Taxable Unit Rate
  const handleInclusivePriceChange = (index: number, val: number) => {
    const gross = Math.max(0, val);
    const gst = items[index].gstRate || 0;
    const taxable = gst > 0 ? Math.round((gross / (1 + gst / 100)) * 100) / 100 : gross;
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        inclusivePrice: gross,
        unitPrice: taxable,
        manualTaxableValue: undefined,
      };
      return updated;
    });
  };

  // Change Taxable Unit Rate directly -> automatically recalculates Inclusive Price
  const handleTaxableUnitPriceChange = (index: number, val: number) => {
    const taxable = Math.max(0, val);
    const gst = items[index].gstRate || 0;
    const gross = Math.round((taxable * (1 + gst / 100)) * 100) / 100;
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        unitPrice: taxable,
        inclusivePrice: gross,
        manualTaxableValue: undefined,
      };
      return updated;
    });
  };

  // Change GST Rate -> keeps inclusive price fixed and recomputes base taxable rate
  const handleGstRateChange = (index: number, newGst: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const taxable = newGst > 0 ? Math.round((item.inclusivePrice / (1 + newGst / 100)) * 100) / 100 : item.inclusivePrice;
      updated[index] = {
        ...item,
        gstRate: newGst,
        unitPrice: taxable,
        manualTaxableValue: undefined,
      };
      return updated;
    });
  };

  const handleManualTaxableChange = (index: number, val: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        manualTaxableValue: val,
      };
      return updated;
    });
  };

  const handleCatalogProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p._id === productId);
    if (prod) {
      applyProductToRow(index, prod);
    }
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        hsn: '',
        qty: 1,
        unit: 'NOS',
        inclusivePrice: 0,
        unitPrice: 0,
        discount: 0,
        gstRate: 18,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (activeSuggestionIndex === index) {
      setActiveSuggestionIndex(null);
    }
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

    const base = Math.round((qty * rate) * 100) / 100;
    const taxable = item.manualTaxableValue !== undefined
      ? Number(item.manualTaxableValue)
      : Math.max(0, Math.round((base - disc) * 100) / 100);

    subtotal += base;
    totalDiscount += disc;
    taxableSubtotal += taxable;

    if (gst > 0) {
      if (isIntraState) {
        cgstTotal += Math.round(((taxable * (gst / 2)) / 100) * 100) / 100;
        sgstTotal += Math.round(((taxable * (gst / 2)) / 100) * 100) / 100;
      } else {
        igstTotal += Math.round(((taxable * gst) / 100) * 100) / 100;
      }
    }
  });

  const freight = Math.max(0, Number(freightCharges) || 0);
  const rawGrandTotal = taxableSubtotal + cgstTotal + sgstTotal + igstTotal + freight;
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
      const computedItems = items.map((it) => {
        const qty = Number(it.qty) || 1;
        const unitPrice = Number(it.unitPrice) || 0;
        const discount = Number(it.discount) || 0;
        const gstRate = Number(it.gstRate) || 0;
        const taxableValue = it.manualTaxableValue !== undefined
          ? Number(it.manualTaxableValue)
          : Math.max(0, Math.round((qty * unitPrice - discount) * 100) / 100);

        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;
        if (gstRate > 0) {
          if (isIntraState) {
            cgstAmount = Math.round(((taxableValue * (gstRate / 2)) / 100) * 100) / 100;
            sgstAmount = Math.round(((taxableValue * (gstRate / 2)) / 100) * 100) / 100;
          } else {
            igstAmount = Math.round(((taxableValue * gstRate) / 100) * 100) / 100;
          }
        }
        const total = Math.round((taxableValue + cgstAmount + sgstAmount + igstAmount) * 100) / 100;

        const isKit = Boolean(it.isKit);
        const kitItems = isKit && it.kitItemsText
          ? it.kitItemsText.split('\n').map((s) => s.trim()).filter(Boolean)
          : [];

        return {
          name: it.name.trim(),
          description: '',
          isKit,
          kitItems,
          hsn: (it.hsn || '').trim().toUpperCase(),
          qty,
          unit: it.unit,
          unitPrice,
          inclusivePrice: it.inclusivePrice,
          isPriceInclusive: Boolean(it.inclusivePrice && it.inclusivePrice > 0),
          discount,
          taxableValue,
          gstRate,
          cgstAmount,
          sgstAmount,
          igstAmount,
          total,
        };
      });

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
        freightCharges: freight,
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Line Items & Kits</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                GST-Inclusive Website Pricing Enabled
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Type product or kit keyword for instant suggestions. Edit either Inclusive Price OR Taxable Rate manually.
            </p>
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

        <div className="overflow-x-auto min-h-[380px] pb-44">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-2 w-8 text-center">#</th>
                <th className="py-3 px-3 min-w-[260px]">Item Description & Suggestion</th>
                <th className="py-3 px-2 w-24 text-center">Catalog</th>
                <th className="py-3 px-2 w-28 text-center bg-blue-50/70 border-x border-blue-100 text-blue-950">
                  <div className="flex flex-col items-center">
                    <span className="font-bold">HSN Code</span>
                    <span className="text-[9px] font-normal text-blue-700">Manual Entry</span>
                  </div>
                </th>
                <th className="py-3 px-2 w-14 text-center">Qty</th>
                <th className="py-3 px-2 w-16 text-center">Unit</th>
                <th className="py-3 px-2 w-28 text-right bg-emerald-50/60 text-emerald-950">
                  <div className="flex flex-col items-end">
                    <span>Price (GST Incl.)</span>
                    <span className="text-[9px] font-normal text-emerald-700">Website Rate</span>
                  </div>
                </th>
                <th className="py-3 px-2 w-28 text-right bg-blue-50/60 text-blue-950">
                  <div className="flex flex-col items-end">
                    <span>Taxable Rate</span>
                    <span className="text-[9px] font-normal text-blue-700">Base Unit Rate</span>
                  </div>
                </th>
                <th className="py-3 px-2 w-18 text-right">Disc (Rs.)</th>
                <th className="py-3 px-2 w-20 text-center">GST %</th>
                <th className="py-3 px-2 w-24 text-right">Taxable Val</th>
                <th className="py-3 px-3 w-28 text-right">Total (Rs.)</th>
                <th className="py-3 px-2 w-8 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => {
                const lineBase = Math.round((item.qty * item.unitPrice) * 100) / 100;
                const lineTaxable = item.manualTaxableValue !== undefined
                  ? Number(item.manualTaxableValue)
                  : Math.max(0, Math.round((lineBase - item.discount) * 100) / 100);
                const lineGst = Math.round(((lineTaxable * item.gstRate) / 100) * 100) / 100;
                const lineTotal = Math.round((lineTaxable + lineGst) * 100) / 100;

                // Keyword match for suggestions
                const searchTerm = item.name.toLowerCase().trim();
                const matchedSuggestions = searchTerm.length >= 1
                  ? products.filter((p) => {
                      return (
                        p.name.toLowerCase().includes(searchTerm) ||
                        (p.sku && p.sku.toLowerCase().includes(searchTerm)) ||
                        (p.description && p.description.toLowerCase().includes(searchTerm))
                      );
                    }).slice(0, 8)
                  : [];

                return (
                  <tr key={index} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-2 text-center text-slate-400 font-semibold">{index + 1}</td>
                    
                    {/* Item Description with Keyword Autocomplete Dropdown directly attached to field */}
                    <td className="py-2.5 px-3 align-top min-w-[300px]">
                      <div className="relative">
                        <div className="relative flex items-center">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              handleItemChange(index, 'name', e.target.value);
                              setActiveSuggestionIndex(index);
                            }}
                            onFocus={() => setActiveSuggestionIndex(index)}
                            placeholder="Type keyword e.g. Arduino, Raspberry Pi, Kit..."
                            className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none text-xs font-semibold text-slate-800 shadow-sm"
                          />
                        </div>

                        {/* Autocomplete Suggestions Popover - attached directly to the search field */}
                        {activeSuggestionIndex === index && matchedSuggestions.length > 0 && (
                          <div
                            className="absolute left-0 top-full mt-1 w-[460px] max-h-72 overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-300 z-50 divide-y divide-slate-100 ring-1 ring-black/5"
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <div className="px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
                              <span className="flex items-center space-x-1.5">
                                <Search className="w-3 h-3 text-blue-600" />
                                <span>Suggested Products & Kits ({matchedSuggestions.length})</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveSuggestionIndex(null)}
                                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                              >
                                ✕ Close
                              </button>
                            </div>
                            {matchedSuggestions.map((p) => {
                              const isKit = Boolean(p.isKit || (p.packageContents && p.packageContents.length > 0));
                              return (
                                <button
                                  key={p._id}
                                  type="button"
                                  onClick={() => applyProductToRow(index, p)}
                                  className="w-full text-left p-2.5 hover:bg-blue-50 transition flex items-start justify-between space-x-2 group"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900 truncate">
                                        {p.name}
                                      </span>
                                      {isKit ? (
                                        <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 rounded">
                                          KIT ({p.packageContents?.length || 0})
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 rounded">
                                          PART
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-slate-500">
                                      <span>HSN: {p.hsn || '8542'}</span>
                                      {p.sku && <span>SKU: {p.sku}</span>}
                                      <span>Unit: {p.unit || (isKit ? 'SET' : 'NOS')}</span>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className="text-xs font-bold text-emerald-800 font-mono">
                                      Rs. {p.unitPrice?.toFixed(2)}
                                    </div>
                                    <div className="text-[9px] text-emerald-600 font-semibold">
                                      GST Incl. ({p.gstRate ?? 18}%)
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Kit Items & Units Section (ONLY for kit payments) */}
                      <div className="mt-1.5">
                        <label className="inline-flex items-center space-x-1.5 cursor-pointer text-[11px] font-semibold text-slate-600 hover:text-blue-900 select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(item.isKit)}
                            onChange={(e) => {
                              const isK = e.target.checked;
                              handleItemChange(index, 'isKit', isK);
                              if (isK && item.unit === 'NOS') {
                                handleItemChange(index, 'unit', 'SET');
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 border-slate-300"
                          />
                          <span className={item.isKit ? 'text-blue-900 font-bold' : ''}>
                            📦 Kit Item (Specify Included Components & Units)
                          </span>
                        </label>

                        {item.isKit && (
                          <div className="mt-1.5 p-2 bg-blue-50/80 border border-blue-200 rounded-lg space-y-1 shadow-sm">
                            <div className="flex items-center justify-between text-[10px] font-bold text-blue-950">
                              <span>Items & Units in this Kit (Printed on Bill):</span>
                              <span className="text-[9px] text-slate-500 font-normal">e.g. 1 NOS Arduino Uno, 2 PCS Servo</span>
                            </div>
                            <textarea
                              rows={3}
                              value={item.kitItemsText || ''}
                              onChange={(e) => handleItemChange(index, 'kitItemsText', e.target.value)}
                              placeholder={"1 NOS Arduino Uno R3 DIP\n2 PCS SG90 Micro Servo 9g\n1 SET 65-pc Jumper Wires\n1 NOS HC-SR04 Ultrasonic Sensor"}
                              className="w-full text-xs font-mono p-1.5 bg-white border border-blue-300 rounded focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder:text-slate-400 text-slate-800"
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Catalog Quick Dropdown */}
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

                    {/* HSN Code (Manual Entry) */}
                    <td className="py-2.5 px-2 bg-blue-50/20 border-x border-blue-100">
                      <input
                        type="text"
                        value={item.hsn}
                        onChange={(e) => handleItemChange(index, 'hsn', e.target.value.toUpperCase())}
                        placeholder="e.g. 8542"
                        className="w-full text-center px-1.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none placeholder:text-slate-400 uppercase tracking-wider"
                      />
                    </td>

                    {/* Qty */}
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                        className="w-full text-center px-1.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-xs"
                      />
                    </td>

                    {/* Unit */}
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

                    {/* Gross Price (Inclusive of GST) - Editable */}
                    <td className="py-2.5 px-2 text-right bg-emerald-50/20">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.inclusivePrice || ''}
                        onChange={(e) => handleInclusivePriceChange(index, Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full text-right px-2 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                      />
                    </td>

                    {/* Base Taxable Rate (Exclusive of GST) - Editable */}
                    <td className="py-2.5 px-2 text-right bg-blue-50/20">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unitPrice || ''}
                        onChange={(e) => handleTaxableUnitPriceChange(index, Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full text-right px-2 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-blue-900 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </td>

                    {/* Discount */}
                    <td className="py-2.5 px-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.discount || ''}
                        onChange={(e) => handleItemChange(index, 'discount', Number(e.target.value))}
                        placeholder="0"
                        className="w-full text-right px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-red-600"
                      />
                    </td>

                    {/* GST % */}
                    <td className="py-2.5 px-2 text-center">
                      <select
                        value={item.gstRate}
                        onChange={(e) => handleGstRateChange(index, Number(e.target.value))}
                        className="w-full text-center px-1 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>

                    {/* Taxable Value */}
                    <td className="py-2.5 px-2 text-right font-mono text-xs font-semibold text-slate-700">
                      Rs. {lineTaxable.toFixed(2)}
                    </td>

                    {/* Total (Line) */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                      Rs. {lineTotal.toFixed(2)}
                    </td>

                    {/* Remove Row */}
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
          <p className="text-xs text-slate-600">
            • <span className="font-semibold text-emerald-800">GST Inclusive Math:</span> Website prices automatically split into base taxable value and GST. You can manually edit any field as needed.
          </p>
        </div>

        {/* Right Side: Financial Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
            <span>Subtotal (Base Taxable)</span>
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

          {/* Freight and Delivery Charges Field */}
          <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
              <span>🚚 Freight & Delivery Charges:</span>
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-mono text-xs">Rs.</span>
              <input
                type="number"
                min="0"
                step="any"
                value={freightCharges || ''}
                onChange={(e) => setFreightCharges(Number(e.target.value) || 0)}
                placeholder="0.00"
                className="w-28 text-right px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

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
