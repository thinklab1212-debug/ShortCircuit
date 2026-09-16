// ============================================================================
// ShortCircuit — Bulk Order Quote Model
// ============================================================================
// Stores incoming bulk order & RFQ inquiries submitted from the shop.
// Admin manually prepares and emails quotations to the customer.
// Tracks status through: New -> Under Review -> Quote Sent -> Completed -> Cancelled
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export type BulkOrderStatus =
  | 'New'
  | 'Under Review'
  | 'Quote Sent'
  | 'Completed'
  | 'Cancelled';

export interface IBulkOrderItem {
  productName: string;
  quantity: number;
  targetPrice?: number;
  notes?: string;
}

export interface IBulkOrderQuote extends Document {
  _id: mongoose.Types.ObjectId;
  quoteNumber: string;
  user?: mongoose.Types.ObjectId;
  customer: {
    name: string;
    email: string;
    phone: string;
    organization?: string;
    city?: string;
    pincode?: string;
  };
  items: IBulkOrderItem[];
  notes?: string;
  status: BulkOrderStatus;
  adminNotes?: string;
  quotedAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const bulkOrderItemSchema = new Schema<IBulkOrderItem>(
  {
    productName: {
      type: String,
      required: [true, 'Product name or description is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    targetPrice: {
      type: Number,
      min: [0, 'Target price cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { _id: false }
);

const bulkOrderQuoteSchema = new Schema<IBulkOrderQuote>(
  {
    quoteNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    customer: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
        maxlength: [120, 'Name cannot exceed 120 characters'],
      },
      email: {
        type: String,
        required: [true, 'Email address is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      },
      phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        maxlength: [20, 'Phone number cannot exceed 20 characters'],
      },
      organization: {
        type: String,
        trim: true,
        maxlength: [150, 'Organization name cannot exceed 150 characters'],
      },
      city: {
        type: String,
        trim: true,
        maxlength: [100, 'City cannot exceed 100 characters'],
      },
      pincode: {
        type: String,
        trim: true,
        maxlength: [10, 'Pincode cannot exceed 10 characters'],
      },
    },
    items: {
      type: [bulkOrderItemSchema],
      required: [true, 'At least one product item is required'],
      validate: {
        validator: (v: IBulkOrderItem[]) => Array.isArray(v) && v.length > 0,
        message: 'A bulk order inquiry must contain at least one item',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'General notes cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['New', 'Under Review', 'Quote Sent', 'Completed', 'Cancelled'],
      default: 'New',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Admin notes cannot exceed 2000 characters'],
    },
    quotedAmount: {
      type: Number,
      min: [0, 'Quoted amount cannot be negative'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

bulkOrderQuoteSchema.index({ status: 1, createdAt: -1 });
bulkOrderQuoteSchema.index({ 'customer.email': 1 });
bulkOrderQuoteSchema.index({ 'customer.phone': 1 });

export const BulkOrderQuote = mongoose.model<IBulkOrderQuote>(
  'BulkOrderQuote',
  bulkOrderQuoteSchema
);

export default BulkOrderQuote;
