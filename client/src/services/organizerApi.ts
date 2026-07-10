import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type {
  ApiResponse,
  PaginatedResponse,
  OrganizerApplication,
  ApplyOrganizerData,
} from '@/types'

// ─── Customer: Organizer Application API ────────────────────────────────────────

export const organizerApi = {
  apply: (data: ApplyOrganizerData) =>
    apiClient.post<ApiResponse<OrganizerApplication>>(API_ROUTES.ORGANIZER.APPLY, data),

  getMyApplication: () =>
    apiClient.get<ApiResponse<OrganizerApplication | null>>(API_ROUTES.ORGANIZER.APPLICATION),
}

// ─── Admin: Organizer Application Management API ────────────────────────────────

export const adminOrganizerApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<OrganizerApplication>>(API_ROUTES.ADMIN_ORGANIZER.BASE, { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<OrganizerApplication>>(API_ROUTES.ADMIN_ORGANIZER.BY_ID(id)),

  approve: (id: string, data?: { adminResponse?: string }) =>
    apiClient.patch<ApiResponse<OrganizerApplication>>(API_ROUTES.ADMIN_ORGANIZER.APPROVE(id), data),

  reject: (id: string, data?: { adminResponse?: string }) =>
    apiClient.patch<ApiResponse<OrganizerApplication>>(API_ROUTES.ADMIN_ORGANIZER.REJECT(id), data),
}

export default organizerApi
