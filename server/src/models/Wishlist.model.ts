// ============================================================================
// ElectroKart — Wishlist Model
// ============================================================================
// Simple per-user product wishlist. Stores an array of product ObjectIds
// with a max limit. Uses unique user index for O(1) lookup.
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IWishlist extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  products: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  count: number;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const wishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
      index: true,
    },
    products: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
      default: [],
      validate: {
        validator: (products: mongoose.Types.ObjectId[]) => products.length <= 100,
        message: 'Wishlist cannot contain more than 100 products',
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

wishlistSchema.index({ user: 1 }, { unique: true });

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------

wishlistSchema.virtual('count').get(function (this: IWishlist) {
  return this.products.length;
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema);

export default Wishlist;
