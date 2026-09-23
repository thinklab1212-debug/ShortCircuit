import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:5050/api' : '/api');

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shortcircuit_billing_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ICustomer {
  _id?: string;
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address: string;
  city?: string;
  state: string;
  stateCode: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
}

export interface IProduct {
  _id?: string;
  name: string;
  sku?: string;
  description?: string;
  hsn: string;
  unit: string;
  unitPrice: number;
  gstRate: number;
  packageContents?: string[];
  isKit?: boolean;
}

export interface IInvoiceItem {
  name: string;
  description?: string;
  isKit?: boolean;
  kitItems?: string[];
  hsn: string;
  qty: number;
  unit: string;
  unitPrice: number;
  inclusivePrice?: number;
  isPriceInclusive?: boolean;
  discount: number;
  taxableValue: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
}

export interface IInvoice {
  _id?: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  placeOfSupply: string;
  paymentMode: string;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  paymentReference?: string;
  customer: ICustomer;
  items: IInvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  taxableSubtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  freightCharges?: number;
  roundOff: number;
  grandTotal: number;
  amountInWords?: string;
  pdfUrl?: string;
  pdfLocalPath?: string;
  emailedAt?: string;
  lastEmailedTo?: string;
  createdAt?: string;
}

export interface ICompany {
  _id?: string;
  name: string;
  tagline?: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  gstin: string;
  pan: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  upiId?: string;
  defaultPrefix: string;
  defaultTerms: string[];
  logoPath?: string;
  stampPath?: string;
}
