// ============================================================================
// ElectroKart — Coupon Model
// ============================================================================
// Manages promotional discount codes. Supports percentage and fixed-amount
// discounts with minimum order amounts, per-user usage limits, max discount
// caps, date-based scheduling, and usage tracking.
// ============================================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface ICoupon extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;                        // e.g., "WELCOME20"
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;               // % or ₹ amount
  minOrderAmount: number;              // Min cart value to apply
  maxDiscount?: number;                // Cap for percentage discounts (₹)
  validFrom: Date;
  validUntil: Date;
  usageLimit: number;                  // Total uses across all users
  usedCount: number;                   // Current total usage
  perUserLimit: number;                // Max uses per individual user
  usedBy: Array<{
    user: mongoose.Types.ObjectId;
    usedAt: Date;
    orderId: mongoose.Types.ObjectId;
  }>;
  applicableCategories?: mongoose.Types.ObjectId[]; // Limit to specific categories
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isValid(): boolean;
  calculateDiscount(cartTotal: number): number;
  hasUserExceededLimit(userId: mongoose.Types.ObjectId): boolean;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const couponUsageSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
  },
  { _id: false }
);

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [20, 'Coupon code cannot exceed 20 characters'],
      match: [/^[A-Z0-9]+$/, 'Coupon code can only contain uppercase letters and numbers'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    discountType: {
      type: String,
      required: [true, 'Discount type is required'],
      enum: {
        values: ['percentage', 'fixed'],
        message: 'Discount type must be percentage or fixed',
      },
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [1, 'Discount value must be at least 1'],
      validate: {
        validator: function (this: ICoupon, value: number): boolean {
          if (this.discountType === 'percentage') {
            return value <= 100;
          }
          return true;
        },
        message: 'Percentage discount cannot exceed 100%',
      },
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative'],
    },
    maxDiscount: {
      type: Number,
      min: [0, 'Maximum discount cannot be negative'],
    },
    validFrom: {
      type: Date,
      required: [true, 'Valid from date is required'],
    },
    validUntil: {
      type: Date,
      required: [true, 'Valid until date is required'],
      validate: {
        validator: function (this: ICoupon, value: Date): boolean {
          return value > this.validFrom;
        },
        message: 'Valid until must be after valid from',
      },
    },
    usageLimit: {
      type: Number,
      required: [true, 'Usage limit is required'],
      min: [1, 'Usage limit must be at least 1'],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, 'Per-user limit must be at least 1'],
    },
    usedBy: {
      type: [couponUsageSchema],
      default: [],
    },
    applicableCategories: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

// ---------------------------------------------------------------------------
// Instance methods
// ---------------------------------------------------------------------------

/**
 * Checks if the coupon is currently valid (active, within date range, not exhausted).
 */
couponSchema.methods.isValid = function (): boolean {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    this.usedCount < this.usageLimit
  );
};

/**
 * Calculates the actual discount for a given cart total.
 * Respects maxDiscount cap for percentage coupons.
 */
couponSchema.methods.calculateDiscount = function (cartTotal: number): number {
  if (cartTotal < this.minOrderAmount) return 0;

  let discount: number;

  if (this.discountType === 'percentage') {
    discount = (cartTotal * this.discountValue) / 100;
    // Apply max discount cap if set
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    // Fixed discount
    discount = this.discountValue;
  }

  // Discount cannot exceed cart total
  return Math.min(discount, cartTotal);
};

/**
 * Checks if a specific user has exceeded their per-user usage limit.
 */
couponSchema.methods.hasUserExceededLimit = function (
  userId: mongoose.Types.ObjectId
): boolean {
  const userUsageCount = this.usedBy.filter(
    (usage: { user: mongoose.Types.ObjectId }) => usage.user.toString() === userId.toString()
  ).length;
  return userUsageCount >= this.perUserLimit;
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);

export default Coupon;
