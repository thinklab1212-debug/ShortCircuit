// ============================================================================
// ElectroKart — Review Model
// ============================================================================
// Handles product reviews with ratings 1–5. Enforces one review per user
// per product via compound unique index. Supports verified purchase badges
// and optional review images. Triggers product rating recalculation on
// save and delete.
// ============================================================================

import mongoose, { Schema, Document, type CallbackError } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  images?: Array<{
    url: string;
    publicId: string;
  }>;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const reviewImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [150, 'Review title cannot exceed 150 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [10, 'Review must be at least 10 characters'],
      maxlength: [2000, 'Review cannot exceed 2000 characters'],
    },
    images: {
      type: [reviewImageSchema],
      validate: {
        validator: (images: typeof reviewImageSchema[]) => images.length <= 3,
        message: 'A review can have at most 3 images',
      },
      default: [],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

// One review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Efficient product review listing
reviewSchema.index({ product: 1, createdAt: -1 });

// Rating distribution queries
reviewSchema.index({ product: 1, rating: 1 });

// ---------------------------------------------------------------------------
// Post-save — recalculate product ratings
// ---------------------------------------------------------------------------

reviewSchema.post('save', async function () {
  const Product = mongoose.model('Product');
  if ('recalculateRatings' in Product) {
    await (Product as any).recalculateRatings(this.product);
  }
});

// ---------------------------------------------------------------------------
// Post-delete — recalculate product ratings
// ---------------------------------------------------------------------------

reviewSchema.post('findOneAndDelete', async function (doc: IReview | null) {
  if (doc) {
    const Product = mongoose.model('Product');
    if ('recalculateRatings' in Product) {
      await (Product as any).recalculateRatings(doc.product);
    }
  }
});

// ---------------------------------------------------------------------------
// Pre-save — auto-set verified purchase
// ---------------------------------------------------------------------------

reviewSchema.pre<IReview>('save', async function (next) {
  if (this.isNew && this.order) {
    const Order = mongoose.model('Order');
    const order = await Order.findOne({
      _id: this.order,
      user: this.user,
      'items.product': this.product,
      orderStatus: 'delivered',
    });
    this.isVerifiedPurchase = !!order;
  }
  next();
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
