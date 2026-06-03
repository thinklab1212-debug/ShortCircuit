// ============================================================================
// ElectroKart — Cart Model
// ============================================================================
// Server-side cart for authenticated users. Stores items with product
// references, selected variant, quantity, and price snapshot. Supports
// guest cart merging on login. Computes totals as virtuals.
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

// ---------------------------------------------------------------------------
// Sub-document interface
// ---------------------------------------------------------------------------

interface ICartItemVariant {
  name: string;
  value: string;
  priceModifier: number;
}

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  variant?: ICartItemVariant;
  quantity: number;
  price: number;               // Snapshot of unit price at time of add
}

// ---------------------------------------------------------------------------
// Main interface
// ---------------------------------------------------------------------------

export interface ICart extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  totalItems: number;
  totalPrice: number;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const cartItemVariantSchema = new Schema<ICartItemVariant>(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    priceModifier: { type: Number, default: 0 },
  },
  { _id: false }
);

const cartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    variant: {
      type: cartItemVariantSchema,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [10, 'Cannot add more than 10 of the same item'],
      default: 1,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
  },
  { _id: true }
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: (items: ICartItem[]) => items.length <= 50,
        message: 'Cart cannot contain more than 50 items',
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

cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ updatedAt: 1 });

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------

cartSchema.virtual('totalItems').get(function (this: ICart) {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.virtual('totalPrice').get(function (this: ICart) {
  return this.items.reduce((sum, item) => {
    const variantModifier = item.variant?.priceModifier ?? 0;
    return sum + (item.price + variantModifier) * item.quantity;
  }, 0);
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const Cart = mongoose.model<ICart>('Cart', cartSchema);

export default Cart;
