// ============================================================================
// ElectroKart — ProjectKit Model (Smart Project Builder)
// ============================================================================
// Admin-curated engineering project kits. Each project contains a Bill of
// Materials (linked to store Products), step-by-step build instructions,
// wiring diagram images, and reference document links.
//
// Storage strategy:
//   - Cover photo       → Cloudinary { url, publicId }
//   - Wiring diagrams   → Google Drive URLs (string)
//   - Step images       → Google Drive URLs (string)
//   - Documents/PDFs    → Google Drive URLs (string)
//
// Users browse projects publicly and add entire kits to cart in one click.
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';
import slugify from 'slugify';

// ---------------------------------------------------------------------------
// Sub-document interfaces
// ---------------------------------------------------------------------------

interface IBomItem {
  _id?: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  quantity: number;
  note?: string;
  isOptional: boolean;
}

interface IWiringDiagram {
  _id?: mongoose.Types.ObjectId;
  imageUrl: string;               // Google Drive sharing URL
  title?: string;
  description?: string;
}

interface IInstructionStep {
  _id?: mongoose.Types.ObjectId;
  stepNumber: number;
  title: string;
  content: string;
  imageUrl?: string;              // Google Drive sharing URL
  tip?: string;
}

interface IDriveDocument {
  _id?: mongoose.Types.ObjectId;
  title: string;
  url: string;                    // Google Drive / Docs / Sheets URL
  type?: 'schematic' | 'datasheet' | 'report' | 'presentation' | 'other';
}

// ---------------------------------------------------------------------------
// Main interface
// ---------------------------------------------------------------------------

export interface IProjectKit extends Document {
  _id: mongoose.Types.ObjectId;

  // Identity
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;

  // Cover (Cloudinary only)
  coverImage: {
    url: string;
    publicId: string;
  };

  // Classification
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  applicationArea: string;
  tags: string[];
  estimatedTime?: string;

  // BOM
  components: IBomItem[];

  // Build Guide
  instructions: IInstructionStep[];

  // Wiring Diagrams (Drive URLs)
  wiringDiagrams: IWiringDiagram[];

  // External Documents (Drive URLs)
  documents: IDriveDocument[];

  // Metadata
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  displayOrder: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  totalComponents: number;
}

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const bomItemSchema = new Schema<IBomItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [50, 'Quantity cannot exceed 50'],
      default: 1,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note cannot exceed 200 characters'],
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const wiringDiagramSchema = new Schema<IWiringDiagram>(
  {
    imageUrl: {
      type: String,
      required: [true, 'Wiring diagram image URL is required'],
      trim: true,
      match: [/^https?:\/\/.+/i, 'Image URL must be a valid HTTP/HTTPS URL'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  { _id: true }
);

const instructionStepSchema = new Schema<IInstructionStep>(
  {
    stepNumber: {
      type: Number,
      required: [true, 'Step number is required'],
      min: [1, 'Step number must be at least 1'],
    },
    title: {
      type: String,
      required: [true, 'Step title is required'],
      trim: true,
      maxlength: [200, 'Step title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Step content is required'],
      maxlength: [3000, 'Step content cannot exceed 3000 characters'],
    },
    imageUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/i, 'Image URL must be a valid HTTP/HTTPS URL'],
    },
    tip: {
      type: String,
      trim: true,
      maxlength: [500, 'Tip cannot exceed 500 characters'],
    },
  },
  { _id: true }
);

const driveDocumentSchema = new Schema<IDriveDocument>(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [150, 'Document title cannot exceed 150 characters'],
    },
    url: {
      type: String,
      required: [true, 'Document URL is required'],
      trim: true,
      match: [/^https?:\/\/.+/i, 'Document URL must be a valid HTTP/HTTPS URL'],
    },
    type: {
      type: String,
      enum: {
        values: ['schematic', 'datasheet', 'report', 'presentation', 'other'],
        message: '{VALUE} is not a valid document type',
      },
    },
  },
  { _id: true }
);

// ---------------------------------------------------------------------------
// Main schema
// ---------------------------------------------------------------------------

const projectKitSchema = new Schema<IProjectKit>(
  {
    // Identity
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [150, 'Project name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },

    // Cover (Cloudinary)
    coverImage: {
      url: { type: String, required: [true, 'Cover image URL is required'] },
      publicId: { type: String, required: [true, 'Cover image public ID is required'] },
    },

    // Classification
    difficulty: {
      type: String,
      required: [true, 'Difficulty level is required'],
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: 'Difficulty must be beginner, intermediate, or advanced',
      },
    },
    applicationArea: {
      type: String,
      required: [true, 'Application area is required'],
      enum: {
        values: [
          'IoT',
          'Robotics',
          'Drones',
          'Home Automation',
          'Wearables',
          'Industrial',
          'Education',
          'Prototyping',
          'Agriculture',
          'Healthcare',
          'Automotive',
          'Environmental Monitoring',
        ],
        message: '{VALUE} is not a valid application area',
      },
    },
    tags: {
      type: [String],
      default: [],
      set: (tags: string[]) => tags.map((t) => t.toLowerCase().trim()),
    },
    estimatedTime: {
      type: String,
      trim: true,
      maxlength: [50, 'Estimated time cannot exceed 50 characters'],
    },

    // BOM
    components: {
      type: [bomItemSchema],
      validate: {
        validator: (items: IBomItem[]) => items.length <= 30,
        message: 'A project can have at most 30 components',
      },
      default: [],
    },

    // Build Guide
    instructions: {
      type: [instructionStepSchema],
      validate: {
        validator: (steps: IInstructionStep[]) => steps.length <= 50,
        message: 'A project can have at most 50 instruction steps',
      },
      default: [],
    },

    // Wiring Diagrams
    wiringDiagrams: {
      type: [wiringDiagramSchema],
      validate: {
        validator: (diagrams: IWiringDiagram[]) => diagrams.length <= 10,
        message: 'A project can have at most 10 wiring diagrams',
      },
      default: [],
    },

    // Documents
    documents: {
      type: [driveDocumentSchema],
      validate: {
        validator: (docs: IDriveDocument[]) => docs.length <= 10,
        message: 'A project can have at most 10 documents',
      },
      default: [],
    },

    // Metadata
    isActive: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
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

projectKitSchema.index({ slug: 1 }, { unique: true });
projectKitSchema.index({ isActive: 1, isFeatured: 1, displayOrder: 1 });
projectKitSchema.index({ isActive: 1, applicationArea: 1 });
projectKitSchema.index({ isActive: 1, difficulty: 1 });
projectKitSchema.index({ isActive: 1, createdAt: -1 });

// Full-text search index
projectKitSchema.index(
  { name: 'text', tags: 'text', shortDescription: 'text' },
  {
    weights: { name: 10, tags: 5, shortDescription: 2 },
    name: 'project_kit_text_search',
  }
);

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------

projectKitSchema.virtual('totalComponents').get(function (this: IProjectKit) {
  return this.components.reduce((sum, item) => sum + item.quantity, 0);
});

// ---------------------------------------------------------------------------
// Pre-save middleware
// ---------------------------------------------------------------------------

projectKitSchema.pre<IProjectKit>('save', function (next) {
  if (this.isModified('name')) {
    this.slug = (slugify as any)(this.name, { lower: true, strict: true });
  }
  next();
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const ProjectKit = mongoose.model<IProjectKit>('ProjectKit', projectKitSchema);

export default ProjectKit;
