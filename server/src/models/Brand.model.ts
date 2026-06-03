// ============================================================================
// ElectroKart — Brand Model
// ============================================================================
// Stores manufacturer/brand information. Auto-generates slugs.
// Tracks product count for efficient filtering on the shop page.
// ============================================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import slugify from 'slugify';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IBrand extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  logo?: {
    url: string;
    publicId: string;
  };
  website?: string;
  countryOfOrigin?: string;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const brandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Brand name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    logo: {
      url: { type: String },
      publicId: { type: String },
    },
    website: {
      type: String,
      trim: true,
    },
    countryOfOrigin: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    productCount: {
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

brandSchema.index({ slug: 1 }, { unique: true });
brandSchema.index({ isActive: 1 });

// ---------------------------------------------------------------------------
// Pre-save — auto-generate slug
// ---------------------------------------------------------------------------

brandSchema.pre<IBrand>('save', function (next) {
  if (this.isModified('name')) {
    this.slug = (slugify as any)(this.name, { lower: true, strict: true });
  }
  next();
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const Brand = mongoose.model<IBrand>('Brand', brandSchema);

export default Brand;
