import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse, PaginatedResponse, Banner, BannerFormData } from '@/types'

const bannerApi = {
  /** Active homepage banners (public). */
  getActive: () => apiClient.get<ApiResponse<Banner[]>>(API_ROUTES.BANNERS.BASE),

  // ── Admin ──
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Banner>>(API_ROUTES.BANNERS.ADMIN, { params }),

  create: (data: BannerFormData) =>
    apiClient.post<ApiResponse<Banner>>(API_ROUTES.BANNERS.ADMIN, data),

  update: (id: string, data: Partial<BannerFormData>) =>
    apiClient.patch<ApiResponse<Banner>>(API_ROUTES.BANNERS.ADMIN_BY_ID(id), data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.BANNERS.ADMIN_BY_ID(id)),
}

export default bannerApi
