// ============================================================================
// ShortCircuit — Workshop Inquiry Model
// ============================================================================
// Stores incoming workshop/training inquiries from schools, colleges & universities.
// Tracks status through: New -> Contacted -> Confirmed -> Completed -> Cancelled.
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export type WorkshopInquiryStatus =
  | 'New'
  | 'Contacted'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled';

export interface IWorkshopInquiry extends Document {
  _id: mongoose.Types.ObjectId;
  institutionName: string;
  institutionType: 'School' | 'College' | 'University' | 'Other';
  contactPerson: string;
  email: string;
  phone: string;
  workshopArea: string;
  expectedStudents: 'Less than 30' | '30–50' | '50–100' | '100–200' | '200+';
  location: string;
  preferredDate?: Date;
  message?: string;
  status: WorkshopInquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const workshopInquirySchema = new Schema<IWorkshopInquiry>(
  {
    institutionName: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
      maxlength: [150, 'Institution name cannot exceed 150 characters'],
    },
    institutionType: {
      type: String,
      enum: ['School', 'College', 'University', 'Other'],
      required: [true, 'Institution type is required'],
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    workshopArea: {
      type: String,
      required: [true, 'Workshop area is required'],
      trim: true,
      maxlength: [100, 'Workshop area cannot exceed 100 characters'],
    },
    expectedStudents: {
      type: String,
      enum: ['Less than 30', '30–50', '50–100', '100–200', '200+'],
      required: [true, 'Expected student count is required'],
    },
    location: {
      type: String,
      required: [true, 'Location/City is required'],
      trim: true,
      maxlength: [120, 'Location cannot exceed 120 characters'],
    },
    preferredDate: {
      type: Date,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1500, 'Message cannot exceed 1500 characters'],
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'New',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

workshopInquirySchema.index({ status: 1, createdAt: -1 });

export const WorkshopInquiry = mongoose.model<IWorkshopInquiry>(
  'WorkshopInquiry',
  workshopInquirySchema
);
export default WorkshopInquiry;
