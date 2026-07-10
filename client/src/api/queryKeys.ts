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

  // Project Kits / Smart Project Builder
  projectKits: {
    all: ['projectKits'] as const,
    lists: () => [...queryKeys.projectKits.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.projectKits.lists(), params] as const,
    featured: () => [...queryKeys.projectKits.all, 'featured'] as const,
    details: () => [...queryKeys.projectKits.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.projectKits.details(), slug] as const,
    bom: (slug: string) => [...queryKeys.projectKits.all, 'bom', slug] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    sales: (params: Record<string, unknown>) => [...queryKeys.analytics.all, 'sales', params] as const,
  },

  // Organizer Applications
  organizerApplications: {
    all: ['organizerApplications'] as const,
    mine: () => [...queryKeys.organizerApplications.all, 'mine'] as const,
    lists: () => [...queryKeys.organizerApplications.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.organizerApplications.lists(), params] as const,
    details: () => [...queryKeys.organizerApplications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.organizerApplications.details(), id] as const,
  },

  // Organizer Events
  organizerEvents: {
    all: ['organizerEvents'] as const,
    lists: () => [...queryKeys.organizerEvents.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.organizerEvents.lists(), params] as const,
    details: () => [...queryKeys.organizerEvents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.organizerEvents.details(), id] as const,
  },

  // Organizer Teams
  organizerTeams: {
    all: ['organizerTeams'] as const,
    lists: (eventId: string) => [...queryKeys.organizerTeams.all, eventId, 'list'] as const,
    list: (eventId: string, params: Record<string, unknown>) => [...queryKeys.organizerTeams.lists(eventId), params] as const,
  },

  // Admin Events
  adminEvents: {
    all: ['adminEvents'] as const,
    lists: () => [...queryKeys.adminEvents.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.adminEvents.lists(), params] as const,
    details: () => [...queryKeys.adminEvents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.adminEvents.details(), id] as const,
  },

  // Public Events
  publicEvents: {
    all: ['publicEvents'] as const,
    lists: () => [...queryKeys.publicEvents.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.publicEvents.lists(), params] as const,
    details: () => [...queryKeys.publicEvents.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.publicEvents.details(), slug] as const,
  },

  // Organizer Purchases
  organizerPurchases: {
    all: ['organizerPurchases'] as const,
    lists: (eventId: string) => [...queryKeys.organizerPurchases.all, eventId, 'list'] as const,
    list: (eventId: string, params: Record<string, unknown>) => [...queryKeys.organizerPurchases.lists(eventId), params] as const,
  },

  // Admin Event Orders
  adminEventOrders: {
    all: ['adminEventOrders'] as const,
    lists: () => [...queryKeys.adminEventOrders.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.adminEventOrders.lists(), params] as const,
  },

  // Customer Event Orders
  customerEventOrders: {
    all: ['customerEventOrders'] as const,
    list: () => [...queryKeys.customerEventOrders.all, 'list'] as const,
  },
} as const

export default queryKeys
