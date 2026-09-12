// ============================================================================
// ShortCircuit — Workshop Model
// ============================================================================
// Represents a workshop or training program offering shown on the public page.
// Admin-controlled, image-free card data.
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkshop extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workshopSchema = new Schema<IWorkshop>(
  {
    title: {
      type: String,
      required: [true, 'Workshop title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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

workshopSchema.index({ isActive: 1, displayOrder: 1, createdAt: -1 });

export const Workshop = mongoose.model<IWorkshop>('Workshop', workshopSchema);
export default Workshop;
