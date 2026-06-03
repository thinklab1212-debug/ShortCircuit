// ─── API Route Constants ────────────────────────────────────────────────────────
// Paths are relative to the API base URL (default: /api/v1).
// Source of truth: server/src/routes/*.

const API_ROUTES = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: (token: string) => `/auth/reset-password/${token}`,
    CHANGE_PASSWORD: '/auth/change-password',
  },

  // Users
  USERS: {
    ME: '/users/me',
    AVATAR: '/users/me/avatar',
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    BLOCK: (id: string) => `/users/${id}/block`,
    ROLE: (id: string) => `/users/${id}/role`,
  },

  // Addresses
  ADDRESSES: {
    BASE: '/addresses',
    BY_ID: (id: string) => `/addresses/${id}`,
    SET_DEFAULT: (id: string) => `/addresses/${id}/default`,
  },

  // Products
  PRODUCTS: {
    BASE: '/products',
    FEATURED: '/products/featured',
    SUGGESTIONS: '/products/search/suggestions',
    BY_SLUG: (slug: string) => `/products/${slug}`,
    RELATED: (id: string) => `/products/${id}/related`,
    ADMIN_ALL: '/products/admin/all',
    BY_ID: (id: string) => `/products/${id}`,
  },

  // Categories
  CATEGORIES: {
    BASE: '/categories',
    TREE: '/categories/tree',
    BY_ID: (id: string) => `/categories/${id}`,
  },

  // Brands
  BRANDS: {
    BASE: '/brands',
    ADMIN_ALL: '/brands/admin/all',
    BY_SLUG: (slug: string) => `/brands/${slug}`,
    BY_ID: (id: string) => `/brands/${id}`,
  },

  // Reviews (nested under products)
  REVIEWS: {
    BY_PRODUCT: (productId: string) => `/products/${productId}/reviews`,
    ONE: (productId: string, reviewId: string) => `/products/${productId}/reviews/${reviewId}`,
  },

  // Cart
  CART: {
    BASE: '/cart',
    ITEMS: '/cart/items',
    ITEM: (itemId: string) => `/cart/items/${itemId}`,
    TOTALS: '/cart/totals',
  },

  // Wishlist
  WISHLIST: {
    BASE: '/wishlist',
    TOGGLE: (productId: string) => `/wishlist/${productId}`,
    REMOVE: (productId: string) => `/wishlist/${productId}`,
  },

  // Orders
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
    INVOICE: (id: string) => `/orders/${id}/invoice`,
    ADMIN_ALL: '/orders/admin/all',
    ADMIN_BY_ID: (id: string) => `/orders/admin/${id}`,
    ADMIN_STATUS: (id: string) => `/orders/admin/${id}/status`,
    ADMIN_TRACKING: (id: string) => `/orders/admin/${id}/tracking`,
  },

  // Coupons
  COUPONS: {
    VALIDATE: '/coupons/validate',
    ADMIN: '/coupons/admin',
    ADMIN_BY_ID: (id: string) => `/coupons/admin/${id}`,
  },

  // Payments
  PAYMENTS: {
    CREATE_ORDER: '/payments/create-order',
    VERIFY: '/payments/verify',
  },

  // Banners
  BANNERS: {
    BASE: '/banners',
    ADMIN: '/banners/admin',
    ADMIN_BY_ID: (id: string) => `/banners/admin/${id}`,
  },

  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    REVENUE: '/analytics/revenue',
    ORDERS: '/analytics/orders',
    TOP_PRODUCTS: '/analytics/top-products',
    TOP_CATEGORIES: '/analytics/top-categories',
  },

  // Uploads
  UPLOADS: {
    IMAGE: '/upload/image',
    IMAGES: '/upload/images',
    DELETE: (publicId: string) => `/upload/${encodeURIComponent(publicId)}`,
  },

  // Search
  SEARCH: {
    BASE: '/search',
    SUGGESTIONS: '/search/suggestions',
  },

  // Vendor Self-Service
  VENDOR: {
    PROFILE: '/vendor/profile',
    PRODUCTS: '/vendor/products',
    PRODUCT_BY_ID: (id: string) => `/vendor/products/${id}`,
    SUBMIT: (id: string) => `/vendor/products/${id}/submit`,
    DASHBOARD: '/vendor/dashboard',
  },

  // Admin Vendor Management
  ADMIN_VENDORS: {
    BASE: '/admin/vendors',
    BY_ID: (id: string) => `/admin/vendors/${id}`,
    REVIEW_QUEUE: '/admin/vendors/products/review-queue',
    REVIEW: (id: string) => `/admin/vendors/products/${id}/review`,
    RESET_PASSWORD: (id: string) => `/admin/vendors/${id}/reset-password`,
  },
} as const

export default API_ROUTES
