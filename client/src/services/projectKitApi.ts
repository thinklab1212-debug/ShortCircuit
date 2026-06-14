import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type {
  ApiResponse,
  PaginatedResponse,
  ProjectKit,
  ProjectKitFormData,
  BomWithPricing,
  AddKitToCartResult,
} from '@/types'

const projectKitApi = {
  /** List active projects (public, paginated, filterable) */
  list: (params?: {
    page?: number
    limit?: number
    applicationArea?: string
    difficulty?: string
    search?: string
    sort?: string
  }) =>
    apiClient.get<PaginatedResponse<ProjectKit>>(API_ROUTES.PROJECT_KITS.BASE, { params }),

  /** Featured active projects for homepage */
  featured: () =>
    apiClient.get<ApiResponse<ProjectKit[]>>(API_ROUTES.PROJECT_KITS.FEATURED),

  /** Full project detail by slug (public) */
  getBySlug: (slug: string) =>
    apiClient.get<ApiResponse<ProjectKit>>(API_ROUTES.PROJECT_KITS.BY_SLUG(slug)),

  /** BOM with live pricing (public) */
  getBom: (slug: string) =>
    apiClient.get<ApiResponse<BomWithPricing>>(API_ROUTES.PROJECT_KITS.BOM(slug)),

  /** Add all required components to cart (auth) */
  addToCart: (id: string) =>
    apiClient.post<ApiResponse<AddKitToCartResult>>(API_ROUTES.PROJECT_KITS.ADD_TO_CART(id)),

  // ── Admin ──
  adminList: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<ProjectKit>>(API_ROUTES.PROJECT_KITS.ADMIN, { params }),

  adminGetById: (id: string) =>
    apiClient.get<ApiResponse<ProjectKit>>(API_ROUTES.PROJECT_KITS.ADMIN_BY_ID(id)),

  create: (data: ProjectKitFormData) =>
    apiClient.post<ApiResponse<ProjectKit>>(API_ROUTES.PROJECT_KITS.ADMIN, data),

  update: (id: string, data: Partial<ProjectKitFormData>) =>
    apiClient.patch<ApiResponse<ProjectKit>>(API_ROUTES.PROJECT_KITS.ADMIN_BY_ID(id), data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.PROJECT_KITS.ADMIN_BY_ID(id)),
}

export default projectKitApi
