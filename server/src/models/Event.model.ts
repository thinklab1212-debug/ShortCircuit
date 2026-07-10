// ============================================================================
// Short Circuit — Event Model
// ============================================================================
// Represents an event created by an approved Organizer for selling event-
// specific kits through the Short Circuit platform.
//
// Architecture:
//   - Event Kits are **Virtual Bundles** — they do NOT create Product records.
//   - `kitProducts` stores a **pricing snapshot** at creation time:
//       { product, productName, priceAtCreation, quantity }
//     This ensures kit value and discount remain immutable after submission,
//     even if the original product price changes later.
//   - `totalKitValue` is computed and stored on create/update:
//       Σ(priceAtCreation × quantity)
//   - `eventKitPrice` is the organizer-set selling price paid by students.
//   - `discount` is auto-calculated: totalKitValue − eventKitPrice
//   - Purchasing is handled by a dedicated `placeEventOrder()` flow that
//     bypasses Cart and does NOT affect product inventory.
//
// Lifecycle:
//   1. Organizer creates event (status: draft)
//   2. Organizer uploads teams CSV
//   3. Organizer submits for review (status: pending)
//   4. Admin approves or rejects
//   5. Approved events are visible to students on the public events page
//   6. Students verify their team ID and purchase via dedicated endpoint
//   7. Organizer marks event as completed when done
//
// Pricing:
//   totalKitValue  = Σ(priceAtCreation × quantity)  — stored, immutable
//   eventKitPrice  = organizer-set selling price     — stored
//   discount       = totalKitValue − eventKitPrice   — virtual (computed)
//   discountPct    = (discount / totalKitValue) × 100 — virtual (computed)
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

// ---------------------------------------------------------------------------
// Sub-document Interfaces
// ---------------------------------------------------------------------------

export interface IEventKitProduct {
  product: mongoose.Types.ObjectId;
  productName: string;
  productSku: string;
  productImage?: string;
  priceAtCreation: number;
  quantity: number;
}

export interface IEventTeam {
  teamId: string;
  leaderName: string;
  purchased: boolean;
  purchasedAt?: Date;
  orderId?: mongoose.Types.ObjectId;
}

// ---------------------------------------------------------------------------
// Main Interface
// ---------------------------------------------------------------------------

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  organizer: mongoose.Types.ObjectId;
  eventName: string;
  slug: string;
  organizationName: string;
  collegeName: string;
  description: string;
  banner: {
    url: string;
    publicId: string;
  };
  startDate: Date;
  endDate: Date;
  eventKitPrice: number;
  totalKitValue: number;
  kitProducts: IEventKitProduct[];
  teams: IEventTeam[];
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  latestImport?: {
    importedBy: mongoose.Types.ObjectId;
    importedAt: Date;
    totalRows: number;
    successRows: number;
    skippedRows: number;
  };
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  totalTeams: number;
  purchasedTeams: number;
  discount: number;
  discountPercentage: number;
}

// ---------------------------------------------------------------------------
// Sub-document Schemas
// ---------------------------------------------------------------------------

const eventKitProductSchema = new Schema<IEventKitProduct>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    productName: {
      type: String,
      required: [true, 'Product name snapshot is required'],
      trim: true,
    },
    productSku: {
      type: String,
      required: [true, 'Product SKU snapshot is required'],
      trim: true,
    },
    productImage: {
      type: String,
      trim: true,
    },
    priceAtCreation: {
      type: Number,
      required: [true, 'Price at creation is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [100, 'Quantity cannot exceed 100'],
    },
  },
  { _id: false }
);

const eventTeamSchema = new Schema<IEventTeam>(
  {
    teamId: {
      type: String,
      required: [true, 'Team ID is required'],
      trim: true,
      minlength: [2, 'Team ID must be at least 2 characters'],
      maxlength: [50, 'Team ID cannot exceed 50 characters'],
    },
    leaderName: {
      type: String,
      required: [true, 'Leader name is required'],
      trim: true,
      minlength: [2, 'Leader name must be at least 2 characters'],
      maxlength: [100, 'Leader name cannot exceed 100 characters'],
    },
    purchased: {
      type: Boolean,
      default: false,
    },
    purchasedAt: {
      type: Date,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Main Schema
// ---------------------------------------------------------------------------

const eventSchema = new Schema<IEvent>(
  {
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer reference is required'],
      index: true,
    },
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      minlength: [3, 'Event name must be at least 3 characters'],
      maxlength: [200, 'Event name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    organizationName: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: [2, 'Organization name must be at least 2 characters'],
      maxlength: [200, 'Organization name cannot exceed 200 characters'],
    },
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      minlength: [3, 'College name must be at least 3 characters'],
      maxlength: [200, 'College name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    banner: {
      url: {
        type: String,
        required: [true, 'Banner image URL is required'],
      },
      publicId: {
        type: String,
        required: [true, 'Banner image public ID is required'],
      },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
      validate: {
        validator: function (this: IEvent, v: Date) {
          return v > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    eventKitPrice: {
      type: Number,
      required: [true, 'Event kit price is required'],
      min: [0, 'Event kit price cannot be negative'],
      default: 0,
    },
    totalKitValue: {
      type: Number,
      required: [true, 'Total kit value is required'],
      min: [0, 'Total kit value cannot be negative'],
      default: 0,
    },
    kitProducts: {
      type: [eventKitProductSchema],
      default: [],
    },
    teams: {
      type: [eventTeamSchema],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'pending', 'approved', 'rejected', 'completed'],
        message: 'Status must be one of: draft, pending, approved, rejected, completed',
      },
      default: 'draft',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    latestImport: {
      importedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      importedAt: {
        type: Date,
      },
      totalRows: {
        type: Number,
      },
      successRows: {
        type: Number,
      },
      skippedRows: {
        type: Number,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

eventSchema.index({ slug: 1 }, { unique: true });
eventSchema.index({ organizer: 1, createdAt: -1 });
eventSchema.index({ status: 1, createdAt: -1 });
eventSchema.index({ 'teams.teamId': 1 });

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------

/** Total number of teams registered for this event. */
eventSchema.virtual('totalTeams').get(function (this: IEvent) {
  return this.teams?.length ?? 0;
});

/** Number of teams that have purchased the kit. */
eventSchema.virtual('purchasedTeams').get(function (this: IEvent) {
  return this.teams?.filter((t) => t.purchased).length ?? 0;
});

/**
 * Auto-calculated discount: totalKitValue − eventKitPrice.
 * Always >= 0. If organizer sets eventKitPrice > totalKitValue, discount is 0.
 */
eventSchema.virtual('discount').get(function (this: IEvent) {
  const diff = (this.totalKitValue ?? 0) - (this.eventKitPrice ?? 0);
  return Math.max(0, diff);
});

/**
 * Discount as a percentage of totalKitValue.
 * Returns 0 if totalKitValue is 0 (avoid division by zero).
 */
eventSchema.virtual('discountPercentage').get(function (this: IEvent) {
  if (!this.totalKitValue || this.totalKitValue === 0) return 0;
  const diff = this.totalKitValue - (this.eventKitPrice ?? 0);
  return Math.max(0, Math.round((diff / this.totalKitValue) * 10000) / 100);
});

// ---------------------------------------------------------------------------
// Pre-save — auto-generate slug + compute totalKitValue
// ---------------------------------------------------------------------------

eventSchema.pre<IEvent>('save', function (next) {
  // Auto-generate slug from eventName
  if (this.isModified('eventName')) {
    const base = (slugify as any)(this.eventName, { lower: true, strict: true });
    const suffix = Math.random().toString(36).substring(2, 7);
    this.slug = `${base}-${suffix}`;
  }

  // Compute totalKitValue from kitProducts pricing snapshots
  if (this.isModified('kitProducts')) {
    this.totalKitValue = this.kitProducts.reduce(
      (sum, item) => sum + item.priceAtCreation * item.quantity,
      0
    );
  }

  next();
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const Event = mongoose.model<IEvent>('Event', eventSchema);

export default Event;
