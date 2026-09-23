import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceItem {
  name: string;
  description?: string;
  isKit?: boolean;
  kitItems?: string[]; // List of items included in the kit
  hsn: string;
  qty: number;
  unit: string;
  unitPrice: number;
  inclusivePrice?: number;
  discount: number; // percentage or fixed
  taxableValue: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
}

export interface IInvoiceCustomer {
  customerId?: string;
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
}

export interface IInvoice extends Document {
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  placeOfSupply: string;
  paymentMode: string;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  paymentReference?: string;
  customer: IInvoiceCustomer;
  items: IInvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  taxableSubtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  freightCharges: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
  pdfUrl?: string;
  pdfLocalPath?: string;
  emailedAt?: string;
  lastEmailedTo?: string;
  terms: string[];
  notes?: string;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  isKit: { type: Boolean, default: false },
  kitItems: { type: [String], default: [] },
  hsn: { type: String, default: '' },
  qty: { type: Number, required: true, default: 1 },
  unit: { type: String, default: 'NOS' },
  unitPrice: { type: Number, required: true, default: 0 },
  inclusivePrice: { type: Number },
  discount: { type: Number, default: 0 },
  taxableValue: { type: Number, required: true, default: 0 },
  gstRate: { type: Number, required: true, default: 18 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  total: { type: Number, required: true, default: 0 },
}, { _id: false });

const InvoiceCustomerSchema = new Schema<IInvoiceCustomer>({
  customerId: { type: String },
  name: { type: String, required: true },
  companyName: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, required: true },
  city: { type: String, default: '' },
  state: { type: String, default: 'Uttar Pradesh' },
  stateCode: { type: String, default: '09' },
  pincode: { type: String, default: '' },
  gstin: { type: String, default: '' },
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNo: { type: String, required: true, unique: true, index: true },
    invoiceDate: { type: String, required: true },
    dueDate: { type: String, default: '' },
    placeOfSupply: { type: String, default: 'Uttar Pradesh (09)' },
    paymentMode: { type: String, default: 'Cash' },
    paymentStatus: { type: String, enum: ['PAID', 'UNPAID', 'PARTIAL'], default: 'PAID' },
    paymentReference: { type: String, default: '' },
    customer: { type: InvoiceCustomerSchema, required: true },
    items: { type: [InvoiceItemSchema], required: true },
    subtotal: { type: Number, required: true, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    taxableSubtotal: { type: Number, required: true, default: 0 },
    cgstTotal: { type: Number, default: 0 },
    sgstTotal: { type: Number, default: 0 },
    igstTotal: { type: Number, default: 0 },
    freightCharges: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    amountInWords: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    pdfLocalPath: { type: String, default: '' },
    terms: { type: [String], default: [] },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
