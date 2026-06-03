// ─── TanStack Query Key Factory ─────────────────────────────────────────────────
// Consistent key structure for cache invalidation

const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    profile: () => [...queryKeys.users.all, 'profile'] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.products.lists(), params] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (idOrSlug: string) => [...queryKeys.products.details(), idOrSlug] as const,
    featured: () => [...queryKeys.products.all, 'featured'] as const,
    search: (query: string) => [...queryKeys.products.all, 'search', query] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.categories.lists(), params] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (idOrSlug: string) => [...queryKeys.categories.details(), idOrSlug] as const,
  },

  // Brands
  brands: {
    all: ['brands'] as const,
    lists: () => [...queryKeys.brands.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.brands.lists(), params] as const,
    details: () => [...queryKeys.brands.all, 'detail'] as const,
    detail: (idOrSlug: string) => [...queryKeys.brands.details(), idOrSlug] as const,
  },

  // Reviews
  reviews: {
    all: ['reviews'] as const,
    byProduct: (productId: string) => [...queryKeys.reviews.all, 'product', productId] as const,
  },

  // Cart
  cart: {
    all: ['cart'] as const,
    detail: () => [...queryKeys.cart.all, 'detail'] as const,
  },

  // Wishlist
  wishlist: {
    all: ['wishlist'] as const,
    detail: () => [...queryKeys.wishlist.all, 'detail'] as const,
    check: (productId: string) => [...queryKeys.wishlist.all, 'check', productId] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.orders.lists(), params] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    myOrders: (params: Record<string, unknown>) => [...queryKeys.orders.all, 'my', params] as const,
  },

  // Coupons
  coupons: {
    all: ['coupons'] as const,
    lists: () => [...queryKeys.coupons.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.coupons.lists(), params] as const,
    detail: (id: string) => [...queryKeys.coupons.all, 'detail', id] as const,
    validate: (code: string) => [...queryKeys.coupons.all, 'validate', code] as const,
  },

  // Banners
  banners: {
    all: ['banners'] as const,
    active: () => [...queryKeys.banners.all, 'active'] as const,
    detail: (id: string) => [...queryKeys.banners.all, 'detail', id] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    sales: (params: Record<string, unknown>) => [...queryKeys.analytics.all, 'sales', params] as const,
  },
} as const

export default queryKeys
