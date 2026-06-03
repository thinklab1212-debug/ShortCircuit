import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse, PaginatedResponse, User, UpdateProfileData } from '@/types'

const userApi = {
  getMe: () => apiClient.get<ApiResponse<User>>(API_ROUTES.USERS.ME),

  updateProfile: (data: UpdateProfileData) =>
    apiClient.patch<ApiResponse<User>>(API_ROUTES.USERS.ME, data),

  updateAvatar: (file: File) => {
    const form = new FormData()
    form.append('avatar', file)
    return apiClient.patch<ApiResponse<{ avatar: { url: string; publicId: string } }>>(
      API_ROUTES.USERS.AVATAR,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  // ── Admin ──
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<User>>(API_ROUTES.USERS.BASE, { params }),

  getById: (id: string) => apiClient.get<ApiResponse<User>>(API_ROUTES.USERS.BY_ID(id)),

  toggleBlock: (id: string) =>
    apiClient.patch<ApiResponse<User>>(API_ROUTES.USERS.BLOCK(id)),

  changeRole: (id: string, role: 'customer' | 'admin') =>
    apiClient.patch<ApiResponse<User>>(API_ROUTES.USERS.ROLE(id), { role }),
}

export default userApi
