// ============================================================================
// Short Circuit — Event Order Model
// ============================================================================
// Stores complete event-only kit order details, distinct from normal shop orders.
// Features:
//   - Custom sequential readable order ID (EV-YYYYMMDD-XXXX)
//   - Complete snapshot of kit products & customer address
//   - Integrates with Razorpay payments and COD
// ============================================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEventKitProductSnapshot {
  product: mongoose.Types.ObjectId;
  productName: string;
  productSku: string;
  productImage: string;
  quantity: number;
  priceAtCreation: number;
}

export interface IEventShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  email?: string;
}

export interface IEventStatusHistoryEntry {
  status: string;
  timestamp: Date;
  note?: string;
  updatedBy?: mongoose.Types.ObjectId;
}

export interface IEventOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: string; // Human-readable: EV-YYYYMMDD-XXXX
  event: mongoose.Types.ObjectId;
  organizer: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  teamId: string;
  leaderName: string;
  kitSnapshot: IEventKitProductSnapshot[];
  addressSnapshot: IEventShippingAddress;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryStatus: 'placed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  statusHistory: IEventStatusHistoryEntry[];
  priceBreakdown: {
    itemsPrice: number;       // Total Kit Value
    discountAmount: number;   // Special Event Discount
    shippingPrice: number;    // Shipping Charges
    taxPrice: number;         // GST Amount
    totalPrice: number;       // Final Amount
  };
  paymentDetails?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  };
  invoiceId?: string;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventOrderModel extends Model<IEventOrder> {
  generateOrderId(): Promise<string>;
}

const eventKitProductSnapshotSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productSku: { type: String, required: true },
  productImage: { type: String, required: false },
  quantity: { type: Number, required: true },
  priceAtCreation: { type: Number, required: true },
}, { _id: false });

const eventShippingAddressSchema = new Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  landmark: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, required: true },
  email: { type: String },
}, { _id: false });

const eventStatusHistoryEntrySchema = new Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const eventOrderSchema = new Schema<IEventOrder, IEventOrderModel>(
  {
    orderId: {
      type: String,
      unique: true,
      index: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teamId: {
      type: String,
      required: true,
      index: true,
    },
    leaderName: {
      type: String,
      required: true,
    },
    kitSnapshot: [eventKitProductSnapshotSchema],
    addressSnapshot: {
      type: eventShippingAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['placed', 'packed', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
      index: true,
    },
    statusHistory: [eventStatusHistoryEntrySchema],
    priceBreakdown: {
      itemsPrice: { type: Number, required: true },
      discountAmount: { type: Number, required: true },
      shippingPrice: { type: Number, required: true },
      taxPrice: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
    },
    paymentDetails: {
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      razorpaySignature: { type: String },
    },
    invoiceId: {
      type: String,
    },
    invoiceUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Custom daily sequential generator: EV-YYYYMMDD-XXXX
eventOrderSchema.statics.generateOrderId = async function (): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `EV-${dateStr}`;

  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const todayCount = await this.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  const sequence = String(todayCount + 1).padStart(4, '0');
  return `${prefix}-${sequence}`;
};

// Index for query sorting by creation date
eventOrderSchema.index({ createdAt: -1 });

// pre-save middleware to assign OrderId
eventOrderSchema.pre<IEventOrder>('save', async function (next) {
  if (!this.orderId) {
    const Model = this.constructor as IEventOrderModel;
    this.orderId = await Model.generateOrderId();
  }
  next();
});

const EventOrder = mongoose.model<IEventOrder, IEventOrderModel>('EventOrder', eventOrderSchema);

export default EventOrder;
