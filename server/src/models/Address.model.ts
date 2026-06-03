// ============================================================================
// ElectroKart — Address Model
// ============================================================================
// Stores user shipping/billing addresses. Supports multiple addresses per
// user with a default flag. Indian address format with pincode validation.
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IAddress extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  type: 'home' | 'office' | 'other';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  formattedAddress: string;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const addressSchema = new Schema<IAddress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number'],
    },
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
      maxlength: [200, 'Address line 1 cannot exceed 200 characters'],
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: [200, 'Address line 2 cannot exceed 200 characters'],
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [100, 'Landmark cannot exceed 100 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      enum: {
        values: [
          'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
          'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
          'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
          'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
          'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
          'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
          'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
          'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
        ],
        message: '{VALUE} is not a valid Indian state/UT',
      },
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^[1-9][0-9]{5}$/, 'Please provide a valid 6-digit Indian pincode'],
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['home', 'office', 'other'],
        message: 'Address type must be home, office, or other',
      },
      default: 'home',
    },
    isDefault: {
      type: Boolean,
      default: false,
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

addressSchema.index({ user: 1 });
addressSchema.index({ user: 1, isDefault: 1 });

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------

addressSchema.virtual('formattedAddress').get(function (this: IAddress) {
  const parts = [
    this.addressLine1,
    this.addressLine2,
    this.landmark,
    this.city,
    this.state,
    this.pincode,
    this.country,
  ].filter(Boolean);
  return parts.join(', ');
});

// ---------------------------------------------------------------------------
// Pre-save — ensure only one default address per user
// ---------------------------------------------------------------------------

addressSchema.pre<IAddress>('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Unset any existing default address for this user
    await mongoose.model('Address').updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// ---------------------------------------------------------------------------
// Limit addresses per user
// ---------------------------------------------------------------------------

addressSchema.pre<IAddress>('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Address').countDocuments({ user: this.user });
    if (count >= 10) {
      const error = new Error('You can save a maximum of 10 addresses');
      return next(error);
    }
  }
  next();
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const Address = mongoose.model<IAddress>('Address', addressSchema);

export default Address;
