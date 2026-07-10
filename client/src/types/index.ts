// ============================================================================
// Short Circuit — Frontend Domain Types
// ============================================================================
// These mirror the backend Mongoose models and ApiResponse envelope exactly.
// Source of truth: server/src/models/*, shared/types, shared/constants.
// ============================================================================

// ─── API Envelope ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  statusCode: number
  message: string
  data: T
  pagination?: PaginationMeta
  timestamp?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  statusCode: number
  message: string
  data: T[]
  pagination: PaginationMeta
  timestamp?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  totalPages: number
  totalResults: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ValidationErrorDetail {
  field: string
  message: string
}

// ─── Enums (string unions matching backend) ─────────────────────────────────────

export type UserRole = 'customer' | 'vendor' | 'admin'

export type ApprovalStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export type PaymentMethod = 'razorpay' | 'upi' | 'cod'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type AddressType = 'home' | 'office' | 'other'
export type DiscountType = 'percentage' | 'fixed'
export type OrderType = 'normal' | 'event'
export type EventStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'completed'
export type OrganizerApplicationStatus = 'pending' | 'approved' | 'rejected'
export type OrganizerStatus = 'active' | 'suspended' | 'disabled'

// ─── Shared media ───────────────────────────────────────────────────────────────

export interface CloudinaryAsset {
  url: string
  publicId: string
}

export interface ProductImage extends CloudinaryAsset {
  alt?: string
  isPrimary?: boolean
}

// ─── User / Auth ────────────────────────────────────────────────────────────────

export interface User {
  _id: string
  firstName: string
  lastName: string
  fullName?: string
  email: string
  phone?: string
  avatar?: CloudinaryAsset
  role: UserRole
  isOrganizer: boolean
  organizerStatus?: OrganizerStatus
  organizerProfile?: OrganizerProfile
  isBlocked?: boolean
  isEmailVerified: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt?: string
}

export interface OrganizerProfile {
  organizationName: string
  collegeName: string
  contactNumber: string
  approvedAt?: string
}

/** POST /auth/login → data */
export interface LoginResponse {
  user: User
  accessToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  password: string
  confirmPassword: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  password: string
  confirmPassword: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  phone?: string
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: CloudinaryAsset
  icon?: string
  parent?: Category | string | null
  isActive: boolean
  displayOrder?: number
  productCount?: number
  /** Present on GET /categories/tree */
  subcategories?: Category[]
  createdAt?: string
  updatedAt?: string
}

export interface CategoryFormData {
  name: string
  description?: string
  icon?: string
  parent?: string | null
  displayOrder?: number
  isActive?: boolean
  image?: CloudinaryAsset
}

// ─── Brand ──────────────────────────────────────────────────────────────────────

export interface Brand {
  _id: string
  name: string
  slug: string
  description?: string
  logo?: CloudinaryAsset
  website?: string
  countryOfOrigin?: string
  isActive: boolean
  productCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface BrandFormData {
  name: string
  description?: string
  website?: string
  countryOfOrigin?: string
  isActive?: boolean
  logo?: CloudinaryAsset
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface ProductSpecification {
  key: string
  value: string
  group?: string
}

export interface ProductVariantOption {
  value: string
  priceModifier: number
  stock: number
  sku?: string
}

export interface ProductVariant {
  name: string
  options: ProductVariantOption[]
}

export interface ProductDimensions {
  length?: number
  width?: number
  height?: number
}

export interface Product {
  _id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  sku: string
  price: number
  salePrice?: number
  discount: number
  category: Category | string
  brand: Brand | string
  tags: string[]
  images: ProductImage[]
  stock: number
  lowStockThreshold?: number
  isFeatured: boolean
  isActive: boolean
  ratingsAverage: number
  ratingsCount: number
  soldCount: number
  variants: ProductVariant[]
  specifications: ProductSpecification[]
  manufacturer?: string
  warranty?: string
  datasheetUrl?: string
  packageContents: string[]
  applicationAreas: string[]
  voltageRating?: string
  currentRating?: string
  weight?: number
  dimensions?: ProductDimensions
  compatibility: string[]
  certifications: string[]
  // virtuals (may be present on detail responses)
  inStock?: boolean
  effectivePrice?: number
  createdAt: string
  updatedAt?: string
  // Vendor fields (present on vendor-scoped queries)
  vendor?: string | User
  vendorPrice?: number
  approvalStatus?: ApprovalStatus
  rejectionReason?: string
  vendorNote?: string
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  imageUploadSource?: 'vendor' | 'admin'
}

export interface ProductFilters {
  search?: string
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  inStock?: boolean
  isFeatured?: boolean
  tags?: string
  applicationArea?: string
  certification?: string
  sort?: string
  page?: number
  limit?: number
  // admin
  isActive?: boolean
}

/** Payload for create/update product (admin) */
export interface ProductFormData {
  name: string
  description: string
  shortDescription?: string
  sku: string
  price: number
  salePrice?: number
  category: string
  brand: string
  tags?: string[]
  images?: ProductImage[]
  stock: number
  lowStockThreshold?: number
  isFeatured?: boolean
  isActive?: boolean
  specifications?: ProductSpecification[]
  manufacturer?: string
  warranty?: string
  datasheetUrl?: string
  packageContents?: string[]
  applicationAreas?: string[]
  voltageRating?: string
  currentRating?: string
  weight?: number
  dimensions?: ProductDimensions
  compatibility?: string[]
  certifications?: string[]
  variants?: ProductVariant[]
}

// ─── Reviews ────────────────────────────────────────────────────────────────────

export interface ReviewUser {
  _id?: string
  firstName: string
  lastName: string
  avatar?: CloudinaryAsset
}

export interface Review {
  _id: string
  user: ReviewUser | string
  product: string
  order?: string
  rating: number
  title?: string
  comment: string
  images?: CloudinaryAsset[]
  isVerifiedPurchase: boolean
  helpfulCount: number
  createdAt: string
  updatedAt?: string
}

export interface ReviewFormData {
  rating: number
  title?: string
  comment: string
}

// ─── Cart ───────────────────────────────────────────────────────────────────────

export interface CartItemVariant {
  name: string
  value: string
  priceModifier?: number
}

/** Cart item with a partially-populated product */
export interface CartItem {
  _id: string
  product: Product
  variant?: CartItemVariant
  quantity: number
  price: number
}

export interface Cart {
  _id: string
  user: string
  items: CartItem[]
  totalItems: number
  totalPrice: number
  createdAt?: string
  updatedAt?: string
}

export interface AddToCartData {
  productId: string
  quantity: number
  variant?: { name: string; value: string }
}

export interface CartTotals {
  itemsPrice: number
  shippingPrice: number
  taxPrice: number
  discountAmount: number
  totalPrice: number
  couponApplied?: boolean
  couponError?: string
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export interface Wishlist {
  _id: string
  user: string
  products: Product[]
  count?: number
  createdAt?: string
  updatedAt?: string
}

// ─── Address ────────────────────────────────────────────────────────────────────

export interface Address {
  _id: string
  user: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  landmark?: string
  city: string
  state: string
  pincode: string
  country: string
  type: AddressType
  isDefault: boolean
  formattedAddress?: string
  createdAt?: string
  updatedAt?: string
}

export interface AddressFormData {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  landmark?: string
  city: string
  state: string
  pincode: string
  country?: string
  type?: AddressType
  isDefault?: boolean
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface OrderItem {
  product: string
  name: string
  image: string
  slug: string
  sku?: string
  variant?: { name: string; value: string }
  quantity: number
  price: number
}

export interface ShippingAddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  email?: string;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus
  timestamp: string
  note?: string
}

export interface PaymentDetails {
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
}

export interface CancellationRequest {
  requested: boolean
  requestedAt?: string
  category?:
    | 'ordered_by_mistake'
    | 'found_better_price'
    | 'delivery_delay'
    | 'address_issue'
    | 'financial_reason'
    | 'duplicate_order'
    | 'other'
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  adminResponse?: string
  internalAdminNote?: string
  reviewedAt?: string
  reviewedBy?: string
}

export interface Order {
  _id: string
  orderId: string
  user: User | string
  items: OrderItem[]
  shippingAddress: ShippingAddressSnapshot
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentDetails?: PaymentDetails
  orderStatus: OrderStatus
  statusHistory: OrderStatusHistoryEntry[]
  itemsPrice: number
  shippingPrice: number
  taxPrice: number
  discountAmount: number
  totalPrice: number
  coupon?: string
  couponCode?: string
  estimatedDelivery?: string
  deliveredAt?: string
  shippingTrackingId?: string
  shippingCarrier?: string
  cancelledAt?: string
  cancellationReason?: string
  cancellationRequest?: CancellationRequest
  invoiceUrl?: string
  invoiceNumber?: string
  customerNote?: string
  createdAt: string
  updatedAt?: string
}

/** POST /orders body */
export interface CreateOrderData {
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  customerNote?: string;
  email: string;
}

export interface UpdateOrderStatusData {
  status: OrderStatus
  note?: string
}

export interface TrackingUpdateData {
  shippingCarrier: string
  shippingTrackingId: string
}

// ─── Payments ───────────────────────────────────────────────────────────────────

export interface RazorpayOrderResponse {
  razorpayOrderId: string
  amount: number
  currency: string
  keyId?: string
}

export interface VerifyPaymentData {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
  orderId: string
}

// ─── Coupons ────────────────────────────────────────────────────────────────────

export interface Coupon {
  _id: string
  code: string
  description?: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount: number
  maxDiscount?: number
  validFrom: string
  validUntil: string
  usageLimit: number
  usedCount: number
  perUserLimit: number
  applicableCategories?: string[]
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CouponFormData {
  code: string
  description?: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount?: number
  maxDiscount?: number
  validFrom: string
  validUntil: string
  usageLimit: number
  perUserLimit?: number
  applicableCategories?: string[]
  isActive?: boolean
}

export interface ValidateCouponData {
  code: string
  cartTotal: number
  cartCategoryIds?: string[]
}

export interface CouponValidationResult {
  code: string
  discountType: DiscountType
  discountValue: number
  discountAmount: number
  isApplicable?: boolean
  valid?: boolean
  reason?: string
  message?: string
}

// ─── Banners ────────────────────────────────────────────────────────────────────

export interface Banner {
  _id: string
  title: string
  subtitle?: string
  description?: string
  image: CloudinaryAsset
  mobileImage?: CloudinaryAsset
  link?: string
  linkText?: string
  category?: Category | string
  backgroundColor?: string
  textColor?: string
  position: number
  isActive: boolean
  startDate?: string
  endDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface BannerFormData {
  title: string
  subtitle?: string
  description?: string
  image: CloudinaryAsset
  mobileImage?: CloudinaryAsset
  link?: string
  linkText?: string
  category?: string
  backgroundColor?: string
  textColor?: string
  position?: number
  isActive?: boolean
  startDate?: string
  endDate?: string
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalUsers: number
  pendingOrders?: number
  recentOrders?: Order[]
  lowStockProducts?: Product[]
  revenueGrowth?: number
  orderGrowth?: number
}

export interface RevenueDataPoint {
  date?: string
  month?: string
  revenue: number
  orders: number
}

export interface OrderStats {
  totalOrders: number
  byStatus?: Record<string, number>
  averageOrderValue?: number
  totalRevenue?: number
}

export interface TopProduct {
  _id: string
  name: string
  slug?: string
  image?: string
  totalSold?: number
  unitsSold?: number
  totalRevenue?: number
  revenue?: number
}

export interface TopCategory {
  _id: string
  name: string
  slug?: string
  totalSold?: number
  totalRevenue?: number
  productCount?: number
  revenue?: number
  percentageOfTotal?: number
}

// ─── Uploads ────────────────────────────────────────────────────────────────────

export interface UploadResponse {
  url: string
  publicId: string
}

// ─── Admin Users ──────────────────────────────────────────────────────────────

export interface AdminUserListItem extends User {
  isBlocked: boolean
}

// ─── UI ─────────────────────────────────────────────────────────────────────────

export interface NavLink {
  label: string
  href: string
  icon?: string
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export type Theme = 'light' | 'dark' | 'system'

// ─── Vendor ─────────────────────────────────────────────────────────────────────

export interface VendorProfile {
  _id: string
  user: string | User
  businessName: string
  contactPerson: string
  phone: string
  gstin?: string
  createdAt: string
  updatedAt?: string
}

export interface VendorDashboardStats {
  total: number
  draft: number
  pendingReview: number
  approved: number
  rejected: number
}

export interface CreateVendorData {
  firstName: string
  lastName: string
  email: string
  password: string
  businessName: string
  contactPerson: string
  phone: string
  gstin?: string
}

export interface ReviewProductData {
  action: 'approve' | 'reject'
  price?: number
  salePrice?: number
  reason?: string
  images?: string[]
  imageMergeMode?: 'append' | 'replace'
}

export interface VendorProductFormData {
  name: string
  description: string
  shortDescription?: string
  sku: string
  vendorPrice: number
  category: string
  brand: string
  tags?: string[]
  images?: ProductImage[]
  stock: number
  lowStockThreshold?: number
  specifications?: ProductSpecification[]
  manufacturer?: string
  warranty?: string
  datasheetUrl?: string
  packageContents?: string[]
  applicationAreas?: string[]
  voltageRating?: string
  currentRating?: string
  weight?: number
  dimensions?: ProductDimensions
  compatibility?: string[]
  certifications?: string[]
  vendorNote?: string
  variants?: ProductVariant[]
}

// ─── Project Kits / Smart Project Builder ────────────────────────────────

export interface BomItem {
  _id: string
  product: Product              // Populated from store
  quantity: number
  note?: string
  isOptional: boolean
}

export interface WiringDiagram {
  _id?: string
  imageUrl: string              // Google Drive URL
  title?: string
  description?: string
}

export interface InstructionStep {
  _id?: string
  stepNumber: number
  title: string
  content: string
  imageUrl?: string             // Google Drive URL
  tip?: string
}

export interface DriveDocument {
  _id?: string
  title: string
  url: string                   // Google Drive URL
  type?: 'schematic' | 'datasheet' | 'report' | 'presentation' | 'other'
}

export interface ProjectKit {
  _id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  coverImage: CloudinaryAsset   // Cloudinary ONLY for cover
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  applicationArea: string
  tags: string[]
  estimatedTime?: string
  components: BomItem[]
  instructions: InstructionStep[]
  wiringDiagrams: WiringDiagram[]
  documents: DriveDocument[]
  isActive: boolean
  isFeatured: boolean
  viewCount: number
  displayOrder: number;
  totalComponents: number
  createdAt: string
  updatedAt?: string
}

export interface BomPricingSummary {
  totalItems: number
  totalQuantity: number
  totalMrp: number
  totalPrice: number
  savings: number
  allInStock: boolean
  outOfStockCount: number
}

export interface BomWithPricing {
  components: (BomItem & {
    unitPrice: number
    effectivePrice: number
    subtotal: number
    inStock: boolean
    availableStock: number
  })[]
  summary: BomPricingSummary
}

export interface AddKitToCartResult {
  added: { name: string; quantity: number }[]
  skipped: { name: string; reason: string }[]
  failed: { name: string; reason: string }[]
}

export interface ProjectKitFormData {
  name: string
  description: string
  shortDescription?: string
  coverImage: CloudinaryAsset
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  applicationArea: string
  tags?: string[]
  estimatedTime?: string
  components: {
    product: string
    quantity: number
    note?: string
    isOptional?: boolean
  }[]
  instructions?: {
    stepNumber: number
    title: string
    content: string
    imageUrl?: string
    tip?: string
  }[]
  wiringDiagrams?: {
    imageUrl: string
    title?: string
    description?: string
  }[]
  documents?: {
    title: string
    url: string
    type?: string
  }[]
  isActive?: boolean
  isFeatured?: boolean
  displayOrder?: number
}

// ─── Event Commerce Module ──────────────────────────────────────────────────────

export interface OrganizerApplication {
  _id: string
  user: string | User
  organizationName: string
  collegeName: string
  contactNumber: string
  status: OrganizerApplicationStatus
  adminResponse?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export interface EventKitProduct {
  product: string | Product
  productName: string
  productSku: string
  productImage?: string
  priceAtCreation: number
  quantity: number
}

export interface EventTeam {
  teamId: string
  leaderName: string
  purchased: boolean
  purchasedAt?: string
  orderId?: string
}

export interface EventKitPricing {
  eventKitPrice: number
  totalKitValue: number
  discount: number
  discountPercentage: number
}

export interface Event {
  _id: string
  organizer: string | User
  eventName: string
  slug: string
  organizationName: string
  collegeName: string
  description: string
  banner: CloudinaryAsset
  startDate: string
  endDate: string
  eventKitPrice: number
  totalKitValue: number
  kitProducts: EventKitProduct[]
  teams: EventTeam[]
  status: EventStatus
  rejectionReason?: string
  reviewedBy?: string
  reviewedAt?: string
  approvedBy?: string
  approvedAt?: string
  latestImport?: {
    importedBy: string | User
    importedAt: string
    totalRows: number
    successRows: number
    skippedRows: number
  }
  totalTeams?: number
  purchasedTeams?: number
  discount?: number
  discountPercentage?: number
  createdAt: string
  updatedAt: string
}

export interface PurchaseEventKitData {
  teamId: string
  addressId: string
  paymentMethod: PaymentMethod
  customerNote?: string
}

export interface ApplyOrganizerData {
  organizationName: string
  collegeName: string
  contactNumber: string
}

export interface EventOrder {
  _id: string
  orderId: string
  event: string | Event
  organizer: string | User
  customer: string | User
  teamId: string
  leaderName: string
  kitSnapshot: {
    product: string
    productName: string
    productSku: string
    productImage: string
    quantity: number
    priceAtCreation: number
  }[]
  addressSnapshot: {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    landmark?: string
    city: string
    state: string
    pincode: string
    country: string
    email?: string
  }
  paymentMethod: 'razorpay' | 'cod'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  deliveryStatus: 'placed' | 'packed' | 'shipped' | 'delivered' | 'cancelled'
  statusHistory: {
    status: string
    timestamp: string
    note?: string
  }[]
  priceBreakdown: {
    itemsPrice: number
    discountAmount: number
    shippingPrice: number
    taxPrice: number
    totalPrice: number
  }
  paymentDetails?: {
    razorpayOrderId?: string
    razorpayPaymentId?: string
    razorpaySignature?: string
  }
  invoiceId?: string
  invoiceUrl?: string
  createdAt: string
  updatedAt: string
}
