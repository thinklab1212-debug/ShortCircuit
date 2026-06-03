import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse, Brand, BrandFormData } from '@/types'

const brandApi = {
  getAll: () => apiClient.get<ApiResponse<Brand[]>>(API_ROUTES.BRANDS.BASE),

  getBySlug: (slug: string) =>
    apiClient.get<ApiResponse<Brand>>(API_ROUTES.BRANDS.BY_SLUG(slug)),

  // ── Admin ──
  getAdminAll: () => apiClient.get<ApiResponse<Brand[]>>(API_ROUTES.BRANDS.ADMIN_ALL),

  create: (data: BrandFormData) =>
    apiClient.post<ApiResponse<Brand>>(API_ROUTES.BRANDS.BASE, data),

  update: (id: string, data: Partial<BrandFormData>) =>
    apiClient.patch<ApiResponse<Brand>>(API_ROUTES.BRANDS.BY_ID(id), data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.BRANDS.BY_ID(id)),
}

export default brandApi
