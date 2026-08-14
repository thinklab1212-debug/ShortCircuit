// ============================================================================
// ShortCircuit — Delivery Pincode Model
// ============================================================================
// Stores serviceable delivery pincodes. Admin can add, edit, enable/disable,
// and delete pincodes. Used to validate delivery availability during checkout
// and on product pages.
//
// Currently global: if a pincode is active, all products are deliverable there.
// Service layer is structured to support future per-product restrictions.
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IDeliveryPincode extends Document {
  _id: mongoose.Types.ObjectId;
  pincode: string;
  city?: string;
  state?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const deliveryPincodeSchema = new Schema<IDeliveryPincode>(
  {
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      unique: true,
      match: [/^[1-9]\d{5}$/, 'Please provide a valid 6-digit Indian pincode'],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters'],
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State name cannot exceed 100 characters'],
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

deliveryPincodeSchema.index({ pincode: 1 }, { unique: true });
deliveryPincodeSchema.index({ isActive: 1 });
deliveryPincodeSchema.index({ city: 1 });
deliveryPincodeSchema.index({ state: 1 });

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const DeliveryPincode = mongoose.model<IDeliveryPincode>('DeliveryPincode', deliveryPincodeSchema);

export default DeliveryPincode;
