// ============================================================================
// ElectroKart — Model-Related Type Interfaces
// ============================================================================
// DTOs (Data Transfer Objects) for create/update operations on each model.
// These types define what the service layer accepts from controllers,
// separate from the Mongoose document interfaces (which include _id,
// timestamps, virtuals, and methods).
// ============================================================================

import type { ICloudinaryAsset, IProductImage } from './common.interface.js';

// ---------------------------------------------------------------------------
// User DTOs
// ---------------------------------------------------------------------------

export interface IUpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface IUpdateAvatarDTO {
  avatar: ICloudinaryAsset;
}

export interface IAdminUpdateUserDTO {
  isBlocked?: boolean;
  role?: 'customer' | 'admin';
}

// ---------------------------------------------------------------------------
// Category DTOs
// ---------------------------------------------------------------------------

export interface ICreateCategoryDTO {
  name: string;
  description?: string;
  image?: ICloudinaryAsset;
  icon?: string;
  parent?: string;                    // Parent category ObjectId
  isActive?: boolean;
  displayOrder?: number;
}

export interface IUpdateCategoryDTO {
  name?: string;
  description?: string;
  image?: ICloudinaryAsset;
  icon?: string;
  parent?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

// ---------------------------------------------------------------------------
// Brand DTOs
// ---------------------------------------------------------------------------

export interface ICreateBrandDTO {
  name: string;
  description?: string;
  logo?: ICloudinaryAsset;
  website?: string;
  countryOfOrigin?: string;
  isActive?: boolean;
}

export interface IUpdateBrandDTO {
  name?: string;
  description?: string;
  logo?: ICloudinaryAsset;
  website?: string;
  countryOfOrigin?: string;
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Product DTOs
// ---------------------------------------------------------------------------

export interface IProductVariantOptionDTO {
  value: string;
  priceModifier: number;
  stock: number;
  sku?: string;
}

export interface IProductVariantDTO {
  name: string;
  options: IProductVariantOptionDTO[];
}

export interface IProductSpecificationDTO {
  key: string;
  value: string;
  group?: 'Electrical' | 'Mechanical' | 'Communication' | 'Environmental' | 'Performance' | 'Compatibility' | 'Physical';
}

export interface IProductDimensionsDTO {
  length?: number;
  width?: number;
  height?: number;
}

export interface ICreateProductDTO {
  // Core
  name: string;
  description: string;
  shortDescription?: string;
  sku: string;

  // Pricing
  price: number;
  salePrice?: number;
  costPrice?: number;

  // Categorization
  category: string;                   // ObjectId
  brand: string;                      // ObjectId
  tags?: string[];

  // Inventory
  stock: number;
  lowStockThreshold?: number;
  isFeatured?: boolean;
  isActive?: boolean;

  // Variants & Specs
  variants?: IProductVariantDTO[];
  specifications?: IProductSpecificationDTO[];

  // Engineering fields
  manufacturer?: string;
  warranty?: string;
  datasheetUrl?: string;
  packageContents?: string[];
  applicationAreas?: string[];
  voltageRating?: string;
  currentRating?: string;
  weight?: number;
  dimensions?: IProductDimensionsDTO;
  compatibility?: string[];
  certifications?: string[];
}

export interface IUpdateProductDTO extends Partial<ICreateProductDTO> {
  // All fields optional for partial updates
}

// ---------------------------------------------------------------------------
// Review DTOs
// ---------------------------------------------------------------------------

export interface ICreateReviewDTO {
  rating: number;
  title?: string;
  comment: string;
  order?: string;                     // ObjectId of the order (for verified purchase)
}

export interface IUpdateReviewDTO {
  rating?: number;
  title?: string;
  comment?: string;
}

// ---------------------------------------------------------------------------
// Cart DTOs
// ---------------------------------------------------------------------------

export interface IAddToCartDTO {
  productId: string;
  quantity: number;
  variant?: {
    name: string;
    value: string;
    priceModifier: number;
  };
}

export interface IUpdateCartItemDTO {
  quantity: number;
}

// ---------------------------------------------------------------------------
// Address DTOs
// ---------------------------------------------------------------------------

export interface ICreateAddressDTO {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  type?: 'home' | 'office' | 'other';
  isDefault?: boolean;
}

export interface IUpdateAddressDTO extends Partial<ICreateAddressDTO> {
  // All fields optional for partial updates
}

// ---------------------------------------------------------------------------
// Order DTOs
// ---------------------------------------------------------------------------

export interface IPlaceOrderDTO {
  addressId: string;                  // ObjectId of the shipping address
  paymentMethod: 'razorpay' | 'upi' | 'cod';
  couponCode?: string;
  customerNote?: string;
}

export interface IUpdateOrderStatusDTO {
  orderStatus: 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  note?: string;
  shippingTrackingId?: string;
  shippingCarrier?: string;
}

export interface ICancelOrderDTO {
  cancellationReason: string;
}

// ---------------------------------------------------------------------------
// Coupon DTOs
// ---------------------------------------------------------------------------

export interface ICreateCouponDTO {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom: string;                  // ISO date string
  validUntil: string;                 // ISO date string
  usageLimit: number;
  perUserLimit?: number;
  applicableCategories?: string[];    // ObjectIds
  isActive?: boolean;
}

export interface IUpdateCouponDTO extends Partial<ICreateCouponDTO> {
  // All fields optional for partial updates
}

export interface IValidateCouponDTO {
  code: string;
  cartTotal: number;
}

// ---------------------------------------------------------------------------
// Payment DTOs
// ---------------------------------------------------------------------------

export interface ICreateRazorpayOrderDTO {
  orderId: string;                    // ElectroKart order ID
  amount: number;                     // Amount in paise (₹100 = 10000 paise)
}

export interface IVerifyPaymentDTO {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  orderId: string;                    // ElectroKart order ID
}

// ---------------------------------------------------------------------------
// Banner DTOs
// ---------------------------------------------------------------------------

export interface ICreateBannerDTO {
  title: string;
  subtitle?: string;
  description?: string;
  image: ICloudinaryAsset;
  mobileImage?: ICloudinaryAsset;
  link?: string;
  linkText?: string;
  category?: string;                  // ObjectId
  backgroundColor?: string;
  textColor?: string;
  position?: number;
  isActive?: boolean;
  startDate?: string;                 // ISO date string
  endDate?: string;                   // ISO date string
}

export interface IUpdateBannerDTO extends Partial<ICreateBannerDTO> {
  // All fields optional for partial updates
}

// ---------------------------------------------------------------------------
// Search DTOs
// ---------------------------------------------------------------------------

export interface ISearchSuggestion {
  type: 'product' | 'category' | 'brand';
  text: string;
  slug: string;
  image?: string;
}

// ---------------------------------------------------------------------------
// Analytics Types
// ---------------------------------------------------------------------------

export interface IDashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  recentOrders: any[];               // Will be typed with IOrder in service
  lowStockProducts: number;
  revenueGrowth: number;             // % change from previous period
  orderGrowth: number;               // % change from previous period
}

export interface IRevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface ITopProduct {
  _id: string;
  name: string;
  slug: string;
  image: string;
  totalSold: number;
  totalRevenue: number;
}

export interface ITopCategory {
  _id: string;
  name: string;
  slug: string;
  totalSold: number;
  totalRevenue: number;
}
