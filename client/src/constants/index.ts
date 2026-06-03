// ─── Application Constants ──────────────────────────────────────────────────────

export const APP = {
  NAME: 'ElectroKart',
  TAGLINE: 'Premium Electronics Marketplace',
  DESCRIPTION: 'Discover the latest in electronics with unbeatable prices and premium quality.',
  VERSION: '1.0.0',
} as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  LIMITS: [12, 24, 36, 48],
} as const

export const SORT_OPTIONS = [
  { label: 'Newest First', value: '-createdAt' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Most Popular', value: '-sold' },
  { label: 'Top Rated', value: '-ratingsAverage' },
  { label: 'Name: A-Z', value: 'name' },
  { label: 'Name: Z-A', value: '-name' },
] as const

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
  REFUNDED: 'refunded',
} as const

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
}

export const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  COD: 'cod',
} as const

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const

export const TOAST_DURATION = 4000

export const IMAGE_MAX_SIZE = 5 * 1024 * 1024 // 5MB
export const IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const
