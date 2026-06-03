// ============================================================================
// ElectroKart — Common/Shared Type Interfaces
// ============================================================================
// Reusable type definitions used across multiple modules: pagination,
// API responses, query parameters, sorting, Cloudinary assets, and
// generic CRUD operation types.
// ============================================================================

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/**
 * Parsed pagination parameters from URL query string.
 * Output of `parsePaginationParams()`.
 */
export interface IParsedPagination {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Pagination metadata included in paginated API responses.
 */
export interface IPaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Generic paginated result wrapper.
 */
export interface IPaginatedResult<T> {
  docs: T[];
  pagination: IPaginationMeta;
}

// ---------------------------------------------------------------------------
// API Response Shapes
// ---------------------------------------------------------------------------

/**
 * Standard successful API response structure.
 */
export interface IApiSuccessResponse<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  pagination?: IPaginationMeta;
}

/**
 * Standard error API response structure.
 */
export interface IApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  timestamp: string;
  error: {
    details?: IValidationErrorDetail[];
    stack?: string;               // Only in development
  };
}

/**
 * Individual field-level validation error.
 */
export interface IValidationErrorDetail {
  field: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Query Parameter Types
// ---------------------------------------------------------------------------

/**
 * Base query parameters shared across all list endpoints.
 */
export interface IBaseQueryParams {
  page?: string;
  limit?: string;
  sort?: string;
  search?: string;
}

/**
 * Product-specific query parameters for the shop page.
 */
export interface IProductQueryParams extends IBaseQueryParams {
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  isFeatured?: string;
  tags?: string;
  applicationArea?: string;
  certification?: string;
  isActive?: string;             // Admin only
}

/**
 * Order-specific query parameters for order listing.
 */
export interface IOrderQueryParams extends IBaseQueryParams {
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * User-specific query parameters for admin user listing.
 */
export interface IUserQueryParams extends IBaseQueryParams {
  role?: string;
  isBlocked?: string;
  isEmailVerified?: string;
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

/**
 * Allowed sort directions.
 */
export type SortDirection = 1 | -1;

/**
 * MongoDB sort specification object.
 */
export type SortSpec = Record<string, SortDirection>;

// ---------------------------------------------------------------------------
// Cloudinary Assets
// ---------------------------------------------------------------------------

/**
 * Cloudinary uploaded asset reference.
 * Used by product images, category images, banners, avatars, brand logos.
 */
export interface ICloudinaryAsset {
  url: string;
  publicId: string;
}

/**
 * Product image with optional alt text and primary flag.
 */
export interface IProductImage extends ICloudinaryAsset {
  alt?: string;
  isPrimary?: boolean;
}

/**
 * Cloudinary upload result returned from the upload service.
 */
export interface ICloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resourceType: string;
}

// ---------------------------------------------------------------------------
// Generic Service Result Types
// ---------------------------------------------------------------------------

/**
 * Generic result type for service methods that return a single entity.
 */
export interface IServiceResult<T> {
  data: T;
  message?: string;
}

/**
 * Generic result type for service methods that return a list.
 */
export interface IServiceListResult<T> {
  data: T[];
  pagination: IPaginationMeta;
  message?: string;
}

// ---------------------------------------------------------------------------
// MongoDB Filter Types
// ---------------------------------------------------------------------------

/**
 * Built filter and sort from query parameters.
 */
export interface IBuiltFilters {
  filter: Record<string, any>;
  sort: SortSpec;
}

// ---------------------------------------------------------------------------
// ID Parameter Types
// ---------------------------------------------------------------------------

/**
 * Route parameters containing a MongoDB ObjectId.
 */
export interface IIdParam {
  id: string;
}

/**
 * Route parameters containing a slug.
 */
export interface ISlugParam {
  slug: string;
}

/**
 * Route parameters for product reviews.
 */
export interface IProductReviewParams {
  productId: string;
  reviewId?: string;
}

/**
 * Route parameters for order operations.
 */
export interface IOrderParam {
  orderId: string;
}

/**
 * Route parameters for cart item operations.
 */
export interface ICartItemParam {
  itemId: string;
}

/**
 * Route parameters for product image operations.
 */
export interface IProductImageParam {
  id: string;
  publicId: string;
}
