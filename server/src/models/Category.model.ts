// ============================================================================
// ElectroKart — Category Model
// ============================================================================
// Supports hierarchical categories via self-referencing `parent` field.
// Auto-generates URL slugs. Tracks product count per category for
// efficient display on the storefront.
// ============================================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import slugify from 'slugify';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    publicId: string;
  };
  icon?: string;                   // Emoji or icon class
  parent?: mongoose.Types.ObjectId; // Self-ref for subcategories
  isActive: boolean;
  displayOrder: number;
  productCount: number;            // Denormalized for performance
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryModel extends Model<ICategory> {
  /**
   * Returns category tree with nested children.
   */
  getCategoryTree(): Promise<ICategory[]>;

  /**
   * Recalculates productCount for a specific category.
   */
  updateProductCount(categoryId: mongoose.Types.ObjectId): Promise<void>;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const categorySchema = new Schema<ICategory, ICategoryModel>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
    icon: {
      type: String,
      trim: true,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    productCount: {
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

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1, displayOrder: 1 });

// ---------------------------------------------------------------------------
// Virtuals — subcategories
// ---------------------------------------------------------------------------

categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// ---------------------------------------------------------------------------
// Pre-save — auto-generate slug
// ---------------------------------------------------------------------------

categorySchema.pre<ICategory>('save', function (next) {
  if (this.isModified('name')) {
    this.slug = (slugify as any)(this.name, { lower: true, strict: true });
  }
  next();
});

// ---------------------------------------------------------------------------
// Static methods
// ---------------------------------------------------------------------------

categorySchema.statics.getCategoryTree = async function (): Promise<ICategory[]> {
  // Fetch only root categories (no parent), then populate children
  return this.find({ parent: null, isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      options: { sort: { displayOrder: 1 } },
    })
    .lean() as unknown as Promise<ICategory[]>;
};

categorySchema.statics.updateProductCount = async function (
  categoryId: mongoose.Types.ObjectId
): Promise<void> {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({
    category: categoryId,
    isActive: true,
  });
  await this.findByIdAndUpdate(categoryId, { productCount: count });
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const Category = mongoose.model<ICategory, ICategoryModel>('Category', categorySchema);

export default Category;
