import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse, Category, CategoryFormData } from '@/types'

const categoryApi = {
  getAll: () => apiClient.get<ApiResponse<Category[]>>(API_ROUTES.CATEGORIES.BASE),

  getTree: () => apiClient.get<ApiResponse<Category[]>>(API_ROUTES.CATEGORIES.TREE),

  // ── Admin ──
  create: (data: CategoryFormData) =>
    apiClient.post<ApiResponse<Category>>(API_ROUTES.CATEGORIES.BASE, data),

  update: (id: string, data: Partial<CategoryFormData>) =>
    apiClient.patch<ApiResponse<Category>>(API_ROUTES.CATEGORIES.BY_ID(id), data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.CATEGORIES.BY_ID(id)),
}

export default categoryApi
