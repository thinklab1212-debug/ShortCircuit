// ============================================================================
// ElectroKart — Shared Type Definitions
// ============================================================================
// These types are shared between frontend and backend to ensure type safety
// across the entire stack. Import from '@electrokart/shared/types'.
// ============================================================================

// ---------------------------------------------------------------------------
// Enums & Constants
// ---------------------------------------------------------------------------

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

export enum OrderStatus {
  PLACED = 'placed',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum PaymentMethod {
  RAZORPAY = 'razorpay',
  UPI = 'upi',
  COD = 'cod',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum AddressType {
  HOME = 'home',
  OFFICE = 'office',
  OTHER = 'other',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum CouponStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  USED_UP = 'used_up',
}

// ---------------------------------------------------------------------------
// Cloudinary Asset
// ---------------------------------------------------------------------------

export interface CloudinaryAsset {
  url: string;
  publicId: string;
}

export interface ProductImage extends CloudinaryAsset {
  alt?: string;
}

// ---------------------------------------------------------------------------
// Product Types
// ---------------------------------------------------------------------------

export interface ProductVariantOption {
  value: string;
  priceModifier: number;     // Added/subtracted from base price
  stock: number;
  sku?: string;
}

export interface ProductVariant {
  name: string;              // e.g., "Color", "Storage", "Pin Count"
  options: ProductVariantOption[];
}

export interface ProductSpecification {
  key: string;               // e.g., "Operating Voltage"
  value: string;             // e.g., "3.3V — 5V"
  group?: string;            // e.g., "Electrical", "Mechanical"
}

export interface ProductDimensions {
  length: number;            // cm
  width: number;             // cm
  height: number;            // cm
}

// ---------------------------------------------------------------------------
// Order Types
// ---------------------------------------------------------------------------

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

export interface OrderItemSnapshot {
  product: string;           // ObjectId as string
  name: string;
  image: string;
  slug: string;
  variant?: {
    name: string;
    value: string;
  };
  quantity: number;
  price: number;
}

export interface ShippingAddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface RazorpayPaymentDetails {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

// ---------------------------------------------------------------------------
// Cart Types
// ---------------------------------------------------------------------------

export interface CartItem {
  product: string;           // ObjectId as string
  variant?: {
    name: string;
    value: string;
    priceModifier: number;
  };
  quantity: number;
  price: number;
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    statusCode: number;
    details?: ValidationErrorDetail[];
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Filter & Sort Types (for product listing queries)
// ---------------------------------------------------------------------------

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  sort?: string;             // e.g., "price", "-price", "-createdAt"
  page?: number;
  limit?: number;
}
