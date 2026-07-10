// ============================================================================
// Short Circuit — Organizer Application Model
// ============================================================================
// Tracks customer applications to become Event Organizers.
//
// Lifecycle:
//   1. Customer submits application (status: pending)
//   2. Admin reviews and approves or rejects
//   3. On approval → User.isOrganizer is set to true
//
// Relationship: 1:1 with User (unique index on `user` field).
// Pattern: Mirrors VendorProfile's application/approval workflow.
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IOrganizerApplication extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  organizationName: string;
  collegeName: string;
  contactNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const organizerApplicationSchema = new Schema<IOrganizerApplication>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      index: true,
    },
    organizationName: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: [3, 'Organization name must be at least 3 characters'],
      maxlength: [150, 'Organization name cannot exceed 150 characters'],
    },
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      minlength: [3, 'College name must be at least 3 characters'],
      maxlength: [200, 'College name cannot exceed 200 characters'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: 'Contact number must be a valid 10-digit Indian mobile number',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Status must be one of: pending, approved, rejected',
      },
      default: 'pending',
    },
    adminResponse: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin response cannot exceed 500 characters'],
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
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

organizerApplicationSchema.index({ status: 1, createdAt: -1 });

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const OrganizerApplication = mongoose.model<IOrganizerApplication>(
  'OrganizerApplication',
  organizerApplicationSchema
);

export default OrganizerApplication;
