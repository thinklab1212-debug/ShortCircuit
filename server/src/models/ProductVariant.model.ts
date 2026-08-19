// ============================================================================
// ElectroKart — ProductVariant Model
// ============================================================================
// Linked variant model for high-combination product families (e.g. Resistors,
// Capacitors, LEDs, MOSFETs, Jumper Wires, Relays, etc.).
//
// Each ProductVariant represents a distinct orderable SKU / MPN linked to a
// master Product Family.
// ============================================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface IProductVariantImage {
  url: string;
  publicId: string;
  alt?: string;
}

export interface IProductVariant extends Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;        // Master Product Family reference
  sku: string;                               // Unique Short Circuit SKU
  mpn?: string;                              // Manufacturer Part Number (e.g., RC0805JR-0710KL)

  // Generic key-value spec strings: e.g. { "resistance": "10 kΩ", "tolerance": "1%", "package": "0805" }
  attributes: Map<string, string>;

  // Indexed numeric spec values for parametric search: e.g. { "resistance_ohms": 10000, "power_watts": 0.25 }
  numericalAttributes: Map<string, number>;

  // Pricing & Inventory
  price: number;
  salePrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;

  // Media & Documentation Overrides
  image?: IProductVariantImage;
  datasheetUrl?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVariantModel extends Model<IProductVariant> {}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const productVariantImageSchema = new Schema<IProductVariantImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String, trim: true },
  },
  { _id: false }
);

const productVariantSchema = new Schema<IProductVariant, IProductVariantModel>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Master product reference (productId) is required'],
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'Variant SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-_./]+$/, 'SKU can only contain uppercase letters, numbers, hyphens, dots, underscores, and slashes'],
    },
    mpn: {
      type: String,
      trim: true,
      index: true,
    },

    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    numericalAttributes: {
      type: Map,
      of: Number,
      default: {},
    },

    price: {
      type: Number,
      required: [true, 'Variant price is required'],
      min: [0, 'Price cannot be negative'],
    },
    salePrice: {
      type: Number,
      min: [0, 'Sale price cannot be negative'],
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative'],
      select: false,
    },

    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    image: {
      type: productVariantImageSchema,
    },
    datasheetUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/i, 'Datasheet URL must be a valid HTTP/HTTPS URL'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------------------------------------------------------------------
// Indexes for Fast Parametric Search & Lookups
// ---------------------------------------------------------------------------

productVariantSchema.index({ productId: 1, isActive: 1 });

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const ProductVariant = mongoose.model<IProductVariant, IProductVariantModel>(
  'ProductVariant',
  productVariantSchema
);

export default ProductVariant;
