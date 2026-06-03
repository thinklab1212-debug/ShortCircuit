// ============================================================================
// ElectroKart — Product Model
// ============================================================================
// The core model of the platform. Stores everything about an electronics
// component/kit: pricing, images, variants, technical specifications,
// electrical ratings, certifications, datasheets, and compatibility info.
//
// Extended fields for engineering students:
//   - Voltage & Current ratings
//   - Datasheet PDF URL
//   - Technical specifications (grouped)
//   - Package contents list
//   - Application areas (IoT, Robotics, Drones, etc.)
//   - Compatibility info
//   - Certifications (CE, FCC, RoHS, etc.)
//   - Manufacturer & Warranty
//
// Search: Uses MongoDB compound text index on name, description, tags,
//         and shortDescription for full-text search.
// ============================================================================

import mongoose, { Schema, Document, Model, type CallbackError } from 'mongoose';
import slugify from 'slugify';

// ---------------------------------------------------------------------------
// Sub-document interfaces
// ---------------------------------------------------------------------------

interface IProductImage {
  url: string;
  publicId: string;
  alt?: string;
  isPrimary?: boolean;
}

interface IVariantOption {
  value: string;
  priceModifier: number;
  stock: number;
  sku?: string;
}

interface IProductVariant {
  name: string;
  options: IVariantOption[];
}

interface ISpecification {
  key: string;
  value: string;
  group?: string;         // e.g., "Electrical", "Mechanical", "Communication"
}

interface IDimensions {
  length?: number;         // cm
  width?: number;          // cm
  height?: number;         // cm
}

// ---------------------------------------------------------------------------
// Main product interface
// ---------------------------------------------------------------------------

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;

  // --- Core Info ---
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  sku: string;

  // --- Pricing ---
  price: number;                       // MRP in ₹
  salePrice?: number;                  // Discounted price
  discount?: number;                   // Computed % off
  costPrice?: number;                  // For admin margin analysis

  // --- Categorization ---
  category: mongoose.Types.ObjectId;
  brand: mongoose.Types.ObjectId;
  tags: string[];

  // --- Media ---
  images: IProductImage[];             // Max 15 images

  // --- Inventory ---
  stock: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isActive: boolean;

  // --- Ratings (denormalized from Reviews) ---
  ratingsAverage: number;
  ratingsCount: number;
  soldCount: number;

  // --- Variants ---
  variants: IProductVariant[];         // e.g., "Color": ["Red", "Blue"]

  // --- Technical Specifications ---
  specifications: ISpecification[];    // Grouped key-value specs

  // --- EXTENDED ENGINEERING FIELDS ---

  // Manufacturer & Warranty
  manufacturer?: string;
  warranty?: string;                   // e.g., "1 Year Manufacturer Warranty"

  // Documentation
  datasheetUrl?: string;               // PDF URL (external or Cloudinary)

  // Package
  packageContents?: string[];          // e.g., ["1x Arduino Uno", "1x USB Cable", "1x Header Pins"]

  // Application
  applicationAreas?: string[];         // e.g., ["IoT", "Robotics", "Education"]

  // Electrical Ratings
  voltageRating?: string;             // e.g., "3.3V - 5V", "7V - 12V"
  currentRating?: string;             // e.g., "500mA", "2A max"

  // Physical
  weight?: number;                     // grams
  dimensions?: IDimensions;            // cm

  // Compatibility
  compatibility?: string[];            // e.g., ["Arduino Uno", "ESP32", "Raspberry Pi 4"]

  // Certifications
  certifications?: string[];           // e.g., ["CE", "FCC", "RoHS"]

  // --- Timestamps ---
  createdAt: Date;
  updatedAt: Date;

  // --- Vendor Fields ---
  vendor?: mongoose.Types.ObjectId;        // null = platform-owned (admin-created)
  vendorPrice?: number;                    // Vendor's supply price (hidden from public)
  approvalStatus: 'draft' | 'pending_review' | 'approved' | 'rejected';
  rejectionReason?: string;
  vendorNote?: string;                     // Vendor's note to admin on submission
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;    // Admin who reviewed
  imageUploadSource?: 'vendor' | 'admin';
}

// ---------------------------------------------------------------------------
// Static methods interface
// ---------------------------------------------------------------------------

export interface IProductModel extends Model<IProduct> {
  /**
   * Updates rating stats from the Reviews collection.
   */
  recalculateRatings(productId: mongoose.Types.ObjectId): Promise<void>;
}

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const productImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

const variantOptionSchema = new Schema<IVariantOption>(
  {
    value: { type: String, required: true, trim: true },
    priceModifier: { type: Number, default: 0 },
    stock: { type: Number, required: true, min: 0 },
    sku: { type: String, trim: true },
  },
  { _id: true }
);

const productVariantSchema = new Schema<IProductVariant>(
  {
    name: { type: String, required: true, trim: true },
    options: { type: [variantOptionSchema], required: true },
  },
  { _id: true }
);

const specificationSchema = new Schema<ISpecification>(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    group: {
      type: String,
      trim: true,
      enum: [
        'Electrical',
        'Mechanical',
        'Communication',
        'Environmental',
        'Performance',
        'Compatibility',
        'Physical',
      ],
    },
  },
  { _id: false }
);

const dimensionsSchema = new Schema<IDimensions>(
  {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Main product schema
// ---------------------------------------------------------------------------

const productSchema = new Schema<IProduct, IProductModel>(
  {
    // --- Core Info ---
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [10000, 'Description cannot exceed 10,000 characters'],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]+$/, 'SKU can only contain uppercase letters, numbers, and hyphens'],
    },

    // --- Pricing ---
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    salePrice: {
      type: Number,
      min: [0, 'Sale price cannot be negative'],
      validate: {
        validator: function (this: IProduct, value: number): boolean {
          return !value || value < this.price;
        },
        message: 'Sale price must be less than the regular price',
      },
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    costPrice: {
      type: Number,
      min: 0,
      select: false,        // Hidden from public API
    },

    // --- Categorization ---
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand is required'],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      set: (tags: string[]) => tags.map((t) => t.toLowerCase().trim()),
    },

    // --- Media ---
    images: {
      type: [productImageSchema],
      validate: {
        validator: (images: IProductImage[]) => images.length <= 15,
        message: 'A product can have at most 15 images',
      },
      default: [],
    },

    // --- Inventory ---
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // --- Ratings (denormalized) ---
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val: number) => Math.round(val * 10) / 10, // Round to 1 decimal
    },
    ratingsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- Variants ---
    variants: {
      type: [productVariantSchema],
      default: [],
    },

    // --- Technical Specifications ---
    specifications: {
      type: [specificationSchema],
      default: [],
    },

    // --- EXTENDED ENGINEERING FIELDS ---

    manufacturer: {
      type: String,
      trim: true,
      maxlength: [150, 'Manufacturer name cannot exceed 150 characters'],
    },
    warranty: {
      type: String,
      trim: true,
      maxlength: [200, 'Warranty description cannot exceed 200 characters'],
    },
    datasheetUrl: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/.+/i,
        'Datasheet URL must be a valid HTTP/HTTPS URL',
      ],
    },
    packageContents: {
      type: [String],
      default: [],
    },
    applicationAreas: {
      type: [String],
      default: [],
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
    voltageRating: {
      type: String,
      trim: true,
      maxlength: [100, 'Voltage rating cannot exceed 100 characters'],
    },
    currentRating: {
      type: String,
      trim: true,
      maxlength: [100, 'Current rating cannot exceed 100 characters'],
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
    },
    dimensions: {
      type: dimensionsSchema,
    },
    compatibility: {
      type: [String],
      default: [],
    },
    certifications: {
      type: [String],
      default: [],
      enum: {
        values: ['CE', 'FCC', 'RoHS', 'UL', 'ISO 9001', 'BIS', 'REACH', 'WEEE'],
        message: '{VALUE} is not a recognized certification',
      },
    },

    // --- VENDOR FIELDS ---

    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    vendorPrice: {
      type: Number,
      min: [0, 'Vendor price cannot be negative'],
      select: false,            // Hidden from public API (same as costPrice)
    },
    approvalStatus: {
      type: String,
      enum: {
        values: ['draft', 'pending_review', 'approved', 'rejected'],
        message: 'Approval status must be draft, pending_review, approved, or rejected',
      },
      default: 'draft',         // Safe default — must be explicitly approved
    },
    rejectionReason: {
      type: String,
      maxlength: [1000, 'Rejection reason cannot exceed 1000 characters'],
      trim: true,
    },
    vendorNote: {
      type: String,
      maxlength: [500, 'Vendor note cannot exceed 500 characters'],
      trim: true,
    },
    submittedAt: {
      type: Date,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    imageUploadSource: {
      type: String,
      enum: {
        values: ['vendor', 'admin'],
        message: 'imageUploadSource must be vendor or admin',
      },
      default: 'vendor',
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

// Full-text search index
productSchema.index(
  {
    name: 'text',
    description: 'text',
    shortDescription: 'text',
    tags: 'text',
    manufacturer: 'text',
  },
  {
    weights: {
      name: 10,
      tags: 5,
      shortDescription: 3,
      manufacturer: 2,
      description: 1,
    },
    name: 'product_text_search',
  }
);

// Listing & filtering indexes
productSchema.index({ category: 1, isActive: 1, price: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ isActive: 1, isFeatured: 1, createdAt: -1 });
productSchema.index({ isActive: 1, soldCount: -1 });                // Best sellers
productSchema.index({ isActive: 1, ratingsAverage: -1 });           // Top rated
productSchema.index({ isActive: 1, salePrice: 1, price: 1 });      // Price sort
productSchema.index({ isActive: 1, createdAt: -1 });                // Newest

// Vendor-specific indexes
productSchema.index({ vendor: 1, approvalStatus: 1, createdAt: -1 });
productSchema.index({ approvalStatus: 1, submittedAt: -1 });

// ---------------------------------------------------------------------------
// Virtuals
// ---------------------------------------------------------------------------

// Computed: is product in stock?
productSchema.virtual('inStock').get(function (this: IProduct) {
  return this.stock > 0;
});

// Computed: is stock low?
productSchema.virtual('isLowStock').get(function (this: IProduct) {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// Computed: effective price (salePrice if available, else price)
productSchema.virtual('effectivePrice').get(function (this: IProduct) {
  return this.salePrice ?? this.price;
});

// Virtual: reviews (populated on demand)
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
});

// ---------------------------------------------------------------------------
// Pre-save middleware
// ---------------------------------------------------------------------------

productSchema.pre<IProduct>('save', function (next) {
  // Auto-generate slug from name
  if (this.isModified('name')) {
    this.slug = (slugify as any)(this.name, { lower: true, strict: true });
  }

  // Auto-calculate discount percentage
  if (this.isModified('price') || this.isModified('salePrice')) {
    if (this.salePrice && this.price > 0) {
      this.discount = Math.round(((this.price - this.salePrice) / this.price) * 100);
    } else {
      this.discount = 0;
    }
  }

  next();
});

// ---------------------------------------------------------------------------
// Static methods
// ---------------------------------------------------------------------------

productSchema.statics.recalculateRatings = async function (
  productId: mongoose.Types.ObjectId
): Promise<void> {
  const Review = mongoose.model('Review');

  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        numRatings: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await this.findByIdAndUpdate(productId, {
      ratingsAverage: stats[0].avgRating,
      ratingsCount: stats[0].numRatings,
    });
  } else {
    await this.findByIdAndUpdate(productId, {
      ratingsAverage: 0,
      ratingsCount: 0,
    });
  }
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const Product = mongoose.model<IProduct, IProductModel>('Product', productSchema);

export default Product;
