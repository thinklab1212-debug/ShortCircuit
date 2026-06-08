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
  cancellationReason?: string;

  // Invoice
  invoiceUrl?: string;                // Cloudinary PDF URL
  invoiceNumber?: string;             // e.g., INV-2026-0001

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
    cancellationReason: { type: String, trim: true, maxlength: 500 },

    // Invoice
    invoiceUrl: { type: String },
    invoiceNumber: { type: String, unique: true, sparse: true },

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
 * Generates an invoice number: INV-YYYY-XXXXXXX
 */
orderSchema.statics.generateInvoiceNumber = async function (): Promise<string> {
  const year = new Date().getFullYear();
  const totalOrders = await this.countDocuments();
  const sequence = String(totalOrders + 1).padStart(7, '0');
  return `INV-${year}-${sequence}`;
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

    // GST 18% inclusive in items
    const netSubtotal = this.itemsPrice - this.discountAmount;
    this.taxPrice = Math.round(netSubtotal - (netSubtotal / 1.18));

    // Total (tax is already included in itemsPrice)
    this.totalPrice = netSubtotal + this.shippingPrice;
  }

  next();
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const Order = mongoose.model<IOrder, IOrderModel>('Order', orderSchema);

export default Order;
