// ============================================================================
// ElectroKart — VendorProfile Model
// ============================================================================
// Stores vendor business information. Linked 1:1 with a User document
// whose role is 'vendor'. Intentionally minimal for MVP.
// ============================================================================

import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IVendorProfile extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  businessName: string;
  contactPerson: string;
  phone: string;
  gstin?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const vendorProfileSchema = new Schema<IVendorProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      unique: true,
      trim: true,
      maxlength: [150, 'Business name cannot exceed 150 characters'],
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number'],
    },
    gstin: {
      type: String,
      trim: true,
      maxlength: [15, 'GSTIN cannot exceed 15 characters'],
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

vendorProfileSchema.index({ user: 1 }, { unique: true });
vendorProfileSchema.index({ businessName: 1 }, { unique: true });

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const VendorProfile = mongoose.model<IVendorProfile>('VendorProfile', vendorProfileSchema);

export default VendorProfile;
