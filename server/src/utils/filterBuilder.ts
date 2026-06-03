// ============================================================================
// ElectroKart — MongoDB Filter Builder
// ============================================================================
// Translates URL query parameters into MongoDB filter objects for product
// listing queries. Supports text search, category/brand filtering, price
// ranges, stock filtering, featured flag, and multi-field sorting.
//
// Usage:
//   // GET /products?search=esp32&category=esp32-boards&minPrice=200&maxPrice=5000
//   //              &brand=espressif&inStock=true&sort=-price
//   const { filter, sort } = buildProductFilters(req.query);
//   const products = await Product.find(filter).sort(sort);
// ============================================================================

import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// Query parameter interface
// ---------------------------------------------------------------------------

export interface ProductQueryParams {
  search?: string;
  category?: string;         // Category slug or ObjectId
  brand?: string;            // Brand slug or ObjectId
  minPrice?: string | number;
  maxPrice?: string | number;
  inStock?: string | boolean;
  isFeatured?: string | boolean;
  tags?: string;             // Comma-separated: "wifi,bluetooth,iot"
  applicationArea?: string;
  certification?: string;
  sort?: string;             // e.g., "price", "-price", "ratingsAverage", "-createdAt"
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Filter builder result
// ---------------------------------------------------------------------------

export interface BuiltFilters {
  filter: Record<string, any>;
  sort: Record<string, 1 | -1>;
}

// ---------------------------------------------------------------------------
// Build product filter query
// ---------------------------------------------------------------------------

/**
 * Transforms URL query parameters into a MongoDB filter object and sort spec.
 *
 * @param query - Express req.query object
 * @returns Object containing the MongoDB filter and sort specifications
 *
 * @example
 *   buildProductFilters({
 *     search: 'arduino mega',
 *     category: '665a1b2c3d4e5f6a7b8c9d0e',
 *     minPrice: '500',
 *     maxPrice: '3000',
 *     inStock: 'true',
 *     sort: '-price',
 *   })
 *   // → {
 *   //     filter: {
 *   //       isActive: true,
 *   //       $text: { $search: 'arduino mega' },
 *   //       category: ObjectId('665a...'),
 *   //       price: { $gte: 500, $lte: 3000 },
 *   //       stock: { $gt: 0 },
 *   //     },
 *   //     sort: { price: -1 }
 *   //   }
 */
export function buildProductFilters(query: ProductQueryParams): BuiltFilters {
  const filter: Record<string, any> = {};

  // Always filter for active products (public endpoints)
  filter.isActive = true;

  // -------------------------------------------------------------------------
  // Text search
  // -------------------------------------------------------------------------
  if (query.search && query.search.trim()) {
    filter.$text = { $search: query.search.trim() };
  }

  // -------------------------------------------------------------------------
  // Category filter (supports both ObjectId and slug)
  // -------------------------------------------------------------------------
  if (query.category) {
    if (isValidObjectId(query.category)) {
      filter.category = new mongoose.Types.ObjectId(query.category);
    } else {
      // Will be resolved to ObjectId in the service layer by looking up the slug
      filter._categorySlug = query.category;
    }
  }

  // -------------------------------------------------------------------------
  // Brand filter (supports both ObjectId and slug)
  // -------------------------------------------------------------------------
  if (query.brand) {
    if (isValidObjectId(query.brand)) {
      filter.brand = new mongoose.Types.ObjectId(query.brand);
    } else {
      // Will be resolved to ObjectId in the service layer by looking up the slug
      filter._brandSlug = query.brand;
    }
  }

  // -------------------------------------------------------------------------
  // Price range filter
  // -------------------------------------------------------------------------
  const minPrice = parseFloat(query.minPrice as string);
  const maxPrice = parseFloat(query.maxPrice as string);

  if (!isNaN(minPrice) || !isNaN(maxPrice)) {
    // Use salePrice if exists, else price — we filter on the effective price
    const priceFilter: Record<string, number> = {};
    if (!isNaN(minPrice) && minPrice >= 0) priceFilter.$gte = minPrice;
    if (!isNaN(maxPrice) && maxPrice >= 0) priceFilter.$lte = maxPrice;

    if (Object.keys(priceFilter).length > 0) {
      // Filter on both price and salePrice using $or
      filter.$or = [
        { salePrice: { $exists: true, ...priceFilter } },
        { salePrice: { $exists: false }, price: priceFilter },
      ];
    }
  }

  // -------------------------------------------------------------------------
  // Stock availability filter
  // -------------------------------------------------------------------------
  if (parseBool(query.inStock)) {
    filter.stock = { $gt: 0 };
  }

  // -------------------------------------------------------------------------
  // Featured flag
  // -------------------------------------------------------------------------
  if (parseBool(query.isFeatured)) {
    filter.isFeatured = true;
  }

  // -------------------------------------------------------------------------
  // Tags filter (comma-separated)
  // -------------------------------------------------------------------------
  if (query.tags) {
    const tags = query.tags
      .split(',')
      .map((t: string) => t.trim().toLowerCase())
      .filter(Boolean);

    if (tags.length > 0) {
      filter.tags = { $in: tags };
    }
  }

  // -------------------------------------------------------------------------
  // Application area filter
  // -------------------------------------------------------------------------
  if (query.applicationArea) {
    filter.applicationAreas = query.applicationArea;
  }

  // -------------------------------------------------------------------------
  // Certification filter
  // -------------------------------------------------------------------------
  if (query.certification) {
    filter.certifications = query.certification;
  }

  // -------------------------------------------------------------------------
  // Minimum rating filter
  // -------------------------------------------------------------------------
  const minRating = parseFloat(query.rating as string);
  if (!isNaN(minRating) && minRating > 0) {
    filter.ratingsAverage = { $gte: minRating };
  }

  // -------------------------------------------------------------------------
  // Sort specification
  // -------------------------------------------------------------------------
  const sort = parseSortString(query.sort);

  return { filter, sort };
}

// ---------------------------------------------------------------------------
// Build admin product filters (includes inactive products)
// ---------------------------------------------------------------------------

/**
 * Similar to buildProductFilters but for admin panel — does NOT filter by
 * isActive, and includes additional admin-specific filters.
 */
export function buildAdminProductFilters(query: ProductQueryParams): BuiltFilters {
  const { filter, sort } = buildProductFilters(query);

  // Remove the default isActive filter for admin
  delete filter.isActive;

  // Allow filtering by active/inactive status
  if (query.isActive !== undefined) {
    filter.isActive = parseBool(query.isActive);
  }

  return { filter, sort };
}

// ---------------------------------------------------------------------------
// Build order filters (admin)
// ---------------------------------------------------------------------------

export interface OrderQueryParams {
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  search?: string;          // Search by orderId
  sort?: string;
  [key: string]: any;
}

export function buildOrderFilters(query: OrderQueryParams): BuiltFilters {
  const filter: Record<string, any> = {};

  if (query.orderStatus) {
    filter.orderStatus = query.orderStatus;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  if (query.paymentMethod) {
    filter.paymentMethod = query.paymentMethod;
  }

  // Date range
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate);
    }
  }

  // Search by orderId
  if (query.search) {
    filter.orderId = { $regex: query.search, $options: 'i' };
  }

  const sort = parseSortString(query.sort || '-createdAt');

  return { filter, sort };
}

// ---------------------------------------------------------------------------
// Utility: Parse sort string into MongoDB sort object
// ---------------------------------------------------------------------------

/**
 * Converts a sort string like "-price,createdAt" into a MongoDB sort object.
 * Prefix "-" means descending, no prefix means ascending.
 *
 * @param sortString - Comma-separated sort fields (e.g., "-price,name")
 * @returns MongoDB sort object (e.g., { price: -1, name: 1 })
 */
function parseSortString(sortString?: string): Record<string, 1 | -1> {
  if (!sortString || !sortString.trim()) {
    return { createdAt: -1 }; // Default: newest first
  }

  const sort: Record<string, 1 | -1> = {};
  const fields = sortString.split(',').map((f) => f.trim()).filter(Boolean);

  // Whitelist of allowed sort fields (security: prevent sorting by internal fields)
  const allowedSortFields = new Set([
    'price', 'salePrice', 'createdAt', 'updatedAt', 'name',
    'ratingsAverage', 'ratingsCount', 'soldCount', 'stock',
    'discount', 'totalPrice', 'orderStatus',
  ]);

  for (const field of fields) {
    const isDescending = field.startsWith('-');
    const fieldName = isDescending ? field.slice(1) : field;

    if (allowedSortFields.has(fieldName)) {
      sort[fieldName] = isDescending ? -1 : 1;
    }
  }

  // Fallback if no valid sort fields
  if (Object.keys(sort).length === 0) {
    sort.createdAt = -1;
  }

  return sort;
}

// ---------------------------------------------------------------------------
// Utility: Parse boolean from query string
// ---------------------------------------------------------------------------

function parseBool(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return false;
}

// ---------------------------------------------------------------------------
// Utility: Validate ObjectId string
// ---------------------------------------------------------------------------

function isValidObjectId(value: string): boolean {
  return mongoose.Types.ObjectId.isValid(value) && new mongoose.Types.ObjectId(value).toString() === value;
}

export { isValidObjectId };
