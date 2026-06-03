import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse, PaginatedResponse, Product, ProductFilters, ProductFormData } from '@/types'

// ─── Product API Service ────────────────────────────────────────────────────────

const productApi = {
  getAll: (params?: ProductFilters) =>
    apiClient.get<PaginatedResponse<Product>>(API_ROUTES.PRODUCTS.BASE, { params }),

  getBySlug: (slug: string) =>
    apiClient.get<ApiResponse<Product>>(API_ROUTES.PRODUCTS.BY_SLUG(slug)),

  getFeatured: (limit?: number) =>
    apiClient.get<ApiResponse<Product[]>>(API_ROUTES.PRODUCTS.FEATURED, { params: { limit } }),

  getRelated: (id: string, limit?: number) =>
    apiClient.get<ApiResponse<Product[]>>(API_ROUTES.PRODUCTS.RELATED(id), { params: { limit } }),

  search: (params?: ProductFilters) =>
    apiClient.get<PaginatedResponse<Product>>(API_ROUTES.SEARCH.BASE, { params }),

  getSuggestions: (q: string) =>
    apiClient.get<ApiResponse<string[]>>(API_ROUTES.PRODUCTS.SUGGESTIONS, { params: { q } }),

  // ── Admin ──
  getAdminAll: (params?: ProductFilters) =>
    apiClient.get<PaginatedResponse<Product>>(API_ROUTES.PRODUCTS.ADMIN_ALL, { params }),

  create: (data: ProductFormData) =>
    apiClient.post<ApiResponse<Product>>(API_ROUTES.PRODUCTS.BASE, data),

  update: (id: string, data: Partial<ProductFormData>) =>
    apiClient.patch<ApiResponse<Product>>(API_ROUTES.PRODUCTS.BY_ID(id), data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.PRODUCTS.BY_ID(id)),
}

export default productApi
