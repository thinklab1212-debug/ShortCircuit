// ============================================================================
// ElectroKart — Order Model
// ============================================================================
// Stores complete order lifecycle: from placement through delivery or
// cancellation. Denormalizes item and address data as snapshots so orders
// remain accurate even if products/addresses are later modified.
//
// Features:
//   - Custom readable order ID (EK-YYYYMMDD-XXXX)
//   - Full status history audit trail
//   - Razorpay payment details
//   - GST 18% tax calculation
//   - Free shipping above ₹999
//   - Invoice PDF URL (Cloudinary)
//   - Estimated delivery date computation
// ============================================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// Sub-document interfaces
// ---------------------------------------------------------------------------

interface IOrderItemVariant {
  name: string;
  value: string;
}

interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image: string;
  slug: string;
  sku: string;
  variant?: IOrderItemVariant;
  quantity: number;
  price: number;               // Unit price at time of order
}

interface IShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface IPaymentDetails {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

interface IStatusHistoryEntry {
  status: string;
  timestamp: Date;
  note?: string;
  updatedBy?: mongoose.Types.ObjectId;
}

export interface ITaxRateSnapshot {
  gstPercentage: number;
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
}

export interface IInvoiceSnapshotProduct {
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface IInvoiceSnapshotSeller {
  companyName: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  stampUrl?: string;
}

export interface IInvoiceSnapshotCustomer {
  name: string;
  phone: string;
  address: string;
}

export interface IInvoiceSnapshot {
  invoiceNumber: string;
  invoiceDate: Date;
  settingsId?: string;
  seller: IInvoiceSnapshotSeller;
  customer: IInvoiceSnapshotCustomer;
  products: IInvoiceSnapshotProduct[];
  taxBreakdown: ITaxRateSnapshot;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
}

export interface ICancellationRequest {
  requested: boolean;
  requestedAt?: Date;
  category?:
    | 'ordered_by_mistake'
    | 'found_better_price'
    | 'delivery_delay'
    | 'address_issue'
    | 'financial_reason'
    | 'duplicate_order'
    | 'other';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
  internalAdminNote?: string;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
}

// ---------------------------------------------------------------------------
// Main interface
// ---------------------------------------------------------------------------

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: string;                     // Human-readable: EK-20260530-0001
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;

  // Payment
  paymentMethod: 'razorpay' | 'upi' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentDetails?: IPaymentDetails;

  // Status
  orderStatus: string;
  statusHistory: IStatusHistoryEntry[];

  // Pricing breakdown
  itemsPrice: number;                 // Sum of (item.price * item.quantity)
  shippingPrice: number;              // ₹0 above ₹999, else ₹49
  taxPrice: number;                   // GST 18%
  discountAmount: number;             // Coupon discount
  totalPrice: number;                 // Final payable

  // Coupon
  coupon?: mongoose.Types.ObjectId;
  couponCode?: string;                // Snapshot of code used

  // Delivery
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  shippingTrackingId?: string;
  shippingCarrier?: string;

  // Cancellation
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancellationApprovedAt?: Date;
  cancellationReason?: string;
  cancellationRequest?: ICancellationRequest;

  // Invoice
  invoiceUrl?: string;                // Cloudinary PDF URL
  invoiceNumber?: string;             // e.g., INV-2026-0001
  taxRateSnapshot?: ITaxRateSnapshot;
  invoiceSnapshot?: IInvoiceSnapshot;

  // Notes
  customerNote?: string;
  adminNote?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Static methods interface
// ---------------------------------------------------------------------------

export interface IOrderModel extends Model<IOrder> {
  generateOrderId(): Promise<string>;
  generateInvoiceNumber(): Promise<string>;
}

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const orderItemVariantSchema = new Schema<IOrderItemVariant>(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    slug: { type: String, required: true },
    sku: { type: String, required: true },
    variant: { type: orderItemVariantSchema },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    landmark: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const paymentDetailsSchema = new Schema<IPaymentDetails>(
  {
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
  },
  { _id: false }
);

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      required: true,
      enum: [
        'placed', 'confirmed', 'processing', 'shipped',
        'out_for_delivery', 'delivered', 'cancelled', 'returned',
      ],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: { type: String },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Main order schema
// ---------------------------------------------------------------------------

const orderSchema = new Schema<IOrder, IOrderModel>(
  {
    orderId: {
      type: String,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'Order must contain at least one item'],
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, 'Shipping address is required'],
    },

    // Payment
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['razorpay', 'upi', 'cod'],
        message: 'Payment method must be razorpay, upi, or cod',
      },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentDetails: {
      type: paymentDetailsSchema,
    },

    // Status
    orderStatus: {
      type: String,
      enum: [
        'placed', 'confirmed', 'processing', 'shipped',
        'out_for_delivery', 'delivered', 'cancelled', 'returned',
      ],
      default: 'placed',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    // Pricing breakdown
    itemsPrice: {
      type: Number,
      required: [true, 'Items price is required'],
      min: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    taxPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: 0,
    },

    // Coupon
    coupon: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    couponCode: {
      type: String,
      uppercase: true,
    },

    // Delivery
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    shippingTrackingId: { type: String, trim: true },
    shippingCarrier: { type: String, trim: true },

    // Cancellation
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancellationApprovedAt: { type: Date },
    cancellationReason: { type: String, trim: true, maxlength: 500 },
    cancellationRequest: {
      requested: { type: Boolean, default: false },
      requestedAt: { type: Date },
      category: {
        type: String,
        enum: [
          'ordered_by_mistake',
          'found_better_price',
          'delivery_delay',
          'address_issue',
          'financial_reason',
          'duplicate_order',
          'other'
        ]
      },
      reason: { type: String, trim: true, maxlength: 500 },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected']
      },
      adminResponse: { type: String, trim: true, maxlength: 500 },
      internalAdminNote: { type: String, trim: true, maxlength: 1000, select: false },
      reviewedAt: { type: Date },
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },

    // Invoice
    invoiceUrl: { type: String },
    invoiceNumber: { type: String, unique: true, sparse: true },
    taxRateSnapshot: {
      gstPercentage: { type: Number, default: 18 },
      cgstPercentage: { type: Number, default: 9 },
      sgstPercentage: { type: Number, default: 9 },
      igstPercentage: { type: Number, default: 18 },
    },
    invoiceSnapshot: {
      invoiceNumber: { type: String },
      invoiceDate: { type: Date },
      settingsId: { type: String },
      seller: {
        companyName: { type: String },
        gstin: { type: String },
        address: { type: String },
        phone: { type: String },
        email: { type: String },
        logoUrl: { type: String },
        stampUrl: { type: String },
      },
      customer: {
        name: { type: String },
        phone: { type: String },
        address: { type: String },
      },
      products: [
        {
          name: { type: String },
          sku: { type: String },
          quantity: { type: Number },
          price: { type: Number },
        },
      ],
      taxBreakdown: {
        gstPercentage: { type: Number },
        cgstPercentage: { type: Number },
        sgstPercentage: { type: Number },
        igstPercentage: { type: Number },
      },
      subtotal: { type: Number },
      taxAmount: { type: Number },
      shippingAmount: { type: Number },
      grandTotal: { type: Number },
      paymentMethod: { type: String },
      paymentStatus: { type: String },
    },

    // Notes
    customerNote: { type: String, trim: true, maxlength: 500 },
    adminNote: { type: String, trim: true, maxlength: 500, select: false },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'paymentDetails.razorpayOrderId': 1 }, { sparse: true });

// ---------------------------------------------------------------------------
// Static methods
// ---------------------------------------------------------------------------

/**
 * Generates a human-readable order ID: EK-YYYYMMDD-XXXX
 * Where XXXX is a zero-padded daily sequence number.
 */
orderSchema.statics.generateOrderId = async function (): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `EK-${dateStr}`;

  // Count orders placed today
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const todayCount = await this.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  const sequence = String(todayCount + 1).padStart(4, '0');
  return `${prefix}-${sequence}`;
};

/**
 * Generates an invoice number: e.g. SC-2026-000001
 */
orderSchema.statics.generateInvoiceNumber = async function (): Promise<string> {
  const InvoiceSettings = mongoose.model('InvoiceSettings');
  
  // Concurrency-safe atomic increment
  const settings = await InvoiceSettings.findOneAndUpdate(
    {},
    { $inc: { nextInvoiceNumber: 1 } },
    { new: false, upsert: true, setDefaultsOnInsert: true }
  );

  let num = 1;
  let prefix = 'SC';
  
  if (settings) {
    num = settings.nextInvoiceNumber;
    prefix = settings.invoicePrefix || 'SC';
  } else {
    num = 1;
  }
  
  const year = new Date().getFullYear();
  const sequence = String(num).padStart(6, '0');
  
  return `${prefix}-${year}-${sequence}`;
};

// ---------------------------------------------------------------------------
// Pre-save middleware
// ---------------------------------------------------------------------------

orderSchema.pre<IOrder>('save', async function (next) {
  // Auto-generate orderId on creation
  if (this.isNew && !this.orderId) {
    const Order = mongoose.model('Order') as IOrderModel;
    this.orderId = await Order.generateOrderId();
  }

  // Add initial status to history on creation
  if (this.isNew) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date(),
      note: 'Order placed',
    });

    // Calculate estimated delivery (5-7 business days)
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 7);
    this.estimatedDelivery = delivery;
  }

  // Calculate pricing if not set
  if (this.isModified('items') || this.isNew) {
    // Items price
    this.itemsPrice = this.items.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );

    // Shipping: free above ₹999
    this.shippingPrice = this.itemsPrice >= 999 ? 0 : 49;

    // Fetch InvoiceSettings to get dynamic tax values
    const InvoiceSettings = mongoose.model('InvoiceSettings');
    let settings = await InvoiceSettings.findOne();
    if (!settings) {
      settings = await InvoiceSettings.create({});
    }

    const gstRate = settings.gstPercentage || 18;

    // GST inclusive in items
    const netSubtotal = this.itemsPrice - this.discountAmount;
    const taxableValue = netSubtotal / (1 + gstRate / 100);
    this.taxPrice = Number((netSubtotal - taxableValue).toFixed(2));

    // Total (tax is already included in itemsPrice)
    this.totalPrice = netSubtotal + this.shippingPrice;

    // Snapshot the active tax rate in the order
    this.taxRateSnapshot = {
      gstPercentage: gstRate,
      cgstPercentage: settings.cgstPercentage || (gstRate / 2),
      sgstPercentage: settings.sgstPercentage || (gstRate / 2),
      igstPercentage: settings.igstPercentage || gstRate,
    };
  }

  // Assign invoiceNumber and invoiceSnapshot immediately when status becomes Delivered + Paid
  if (this.orderStatus === 'delivered' && this.paymentStatus === 'paid' && !this.invoiceNumber) {
    const Order = mongoose.model('Order') as IOrderModel;
    const InvoiceSettings = mongoose.model('InvoiceSettings');

    // 1. Generate atomic invoice number
    const invNum = await Order.generateInvoiceNumber();
    this.invoiceNumber = invNum;

    // 2. Fetch invoice settings
    let settings = await InvoiceSettings.findOne();
    if (!settings) {
      settings = await InvoiceSettings.create({});
    }

    // Default company info fallback
    const companyName = settings.companyName || 'EngineersBuy Instruments';
    const businessAddress = settings.businessAddress || 'H. No. - T1, Mavi Mohalla, Tekhand Village, Near DLF Prime Tower, Okhla, Delhi - 110044';
    const contactNumber = settings.contactNumber || '8920266426';
    const supportEmail = settings.supportEmail || 'sales.shortcircuit@gmail.com';
    const gstin = settings.gstin || '07EGQPP9381B1ZU';

    const gstRate = settings.gstPercentage || 18;
    const cgstRate = settings.cgstPercentage || (gstRate / 2);
    const sgstRate = settings.sgstPercentage || (gstRate / 2);
    const igstRate = settings.igstPercentage || gstRate;

    // Calculate inclusive pricing snapshot values
    const inclusiveTotal = this.itemsPrice - this.discountAmount;
    const taxableValueTotal = Number((inclusiveTotal / (1 + gstRate / 100)).toFixed(2));
    const taxAmountTotal = Number((inclusiveTotal - taxableValueTotal).toFixed(2));

    const addr = this.shippingAddress;
    const formattedCustomerAddress = `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}${addr.landmark ? ', ' + addr.landmark : ''}, ${addr.city}, ${addr.state} - ${addr.pincode}, ${addr.country || 'India'}`;

    this.invoiceSnapshot = {
      invoiceNumber: invNum,
      invoiceDate: new Date(),
      settingsId: settings._id.toString(),
      seller: {
        companyName,
        gstin,
        address: businessAddress,
        phone: contactNumber,
        email: supportEmail,
        logoUrl: settings.companyLogo || '',
        stampUrl: settings.companyStamp || '',
      },
      customer: {
        name: addr.fullName,
        phone: addr.phone,
        address: formattedCustomerAddress,
      },
      products: this.items.map(item => ({
        name: item.name + (item.variant ? ` (${item.variant.name}: ${item.variant.value})` : ''),
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
      })),
      taxBreakdown: {
        gstPercentage: gstRate,
        cgstPercentage: cgstRate,
        sgstPercentage: sgstRate,
        igstPercentage: igstRate,
      },
      subtotal: taxableValueTotal,
      taxAmount: taxAmountTotal,
      shippingAmount: this.shippingPrice,
      grandTotal: this.totalPrice,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
    };
  }

  next();
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const Order = mongoose.model<IOrder, IOrderModel>('Order', orderSchema);

export default Order;
