// ============================================================================
// ElectroKart — Banner Model
// ============================================================================
// Manages promotional banners for the homepage carousel. Supports desktop
// and mobile-optimized images, date-based scheduling, position ordering,
// and optional category/product linking.
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IBanner extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  subtitle?: string;
  description?: string;
  image: {
    url: string;
    publicId: string;
  };
  mobileImage?: {
    url: string;
    publicId: string;
  };
  link?: string;                      // Click destination path or URL
  linkText?: string;                  // CTA button text, e.g., "Shop Now"
  category?: mongoose.Types.ObjectId; // Optional category link
  backgroundColor?: string;          // Hex color for fallback/overlay
  textColor?: string;                // Hex color for text
  position: number;                   // Display order (lower = first)
  isActive: boolean;
  startDate?: Date;                   // Scheduled visibility start
  endDate?: Date;                     // Scheduled visibility end
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const bannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Subtitle cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    image: {
      url: { type: String, required: [true, 'Banner image URL is required'] },
      publicId: { type: String, required: [true, 'Banner image public ID is required'] },
    },
    mobileImage: {
      url: { type: String },
      publicId: { type: String },
    },
    link: {
      type: String,
      trim: true,
    },
    linkText: {
      type: String,
      trim: true,
      maxlength: [50, 'Link text cannot exceed 50 characters'],
      default: 'Shop Now',
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    backgroundColor: {
      type: String,
      trim: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color'],
      default: '#000000',
    },
    textColor: {
      type: String,
      trim: true,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color'],
      default: '#FFFFFF',
    },
    position: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (this: IBanner, value: Date): boolean {
          if (this.startDate && value) {
            return value > this.startDate;
          }
          return true;
        },
        message: 'End date must be after start date',
      },
    },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

bannerSchema.index({ isActive: 1, position: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const Banner = mongoose.model<IBanner>('Banner', bannerSchema);

export default Banner;
