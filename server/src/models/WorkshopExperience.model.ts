// ============================================================================
// ShortCircuit — Workshop Experience Model
// ============================================================================
// Represents an institution or organization ShortCircuit has conducted training with.
// Ultra-minimal social proof: logo and name only.
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkshopExperience extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  logo: {
    url: string;
    publicId: string;
  };
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workshopExperienceSchema = new Schema<IWorkshopExperience>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [120, 'Organization name cannot exceed 120 characters'],
    },
    logo: {
      url: {
        type: String,
        required: [true, 'Logo URL is required'],
      },
      publicId: {
        type: String,
        required: [true, 'Logo public ID is required'],
      },
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

workshopExperienceSchema.index({ isActive: 1, displayOrder: 1, createdAt: -1 });

export const WorkshopExperience = mongoose.model<IWorkshopExperience>(
  'WorkshopExperience',
  workshopExperienceSchema
);
export default WorkshopExperience;
