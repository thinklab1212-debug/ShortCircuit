import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type {
  ApiResponse,
  PaginatedResponse,
  Workshop,
  WorkshopFormData,
  WorkshopExperience,
  WorkshopExperienceFormData,
  WorkshopInquiry,
  WorkshopInquiryFormData,
  WorkshopInquiryStatus,
} from '@/types'

const workshopApi = {
  // ── Public ─────────────────────────────────────────────────────────────────

  /** Active workshops for public showcase */
  getActive: () =>
    apiClient.get<ApiResponse<Workshop[]>>(API_ROUTES.WORKSHOPS.PUBLIC),

  /** Active institutions for public logo wall */
  getActiveExperience: () =>
    apiClient.get<ApiResponse<WorkshopExperience[]>>(API_ROUTES.WORKSHOPS.PUBLIC_EXPERIENCE),

  /** Submit inquiry form */
  submitInquiry: (data: WorkshopInquiryFormData) =>
    apiClient.post<ApiResponse<WorkshopInquiry>>(API_ROUTES.WORKSHOPS.INQUIRE, data),

  // ── Admin: Workshops ───────────────────────────────────────────────────────

  getAdminAllWorkshops: () =>
    apiClient.get<ApiResponse<Workshop[]>>(API_ROUTES.WORKSHOPS.ADMIN_ALL),

  createWorkshop: (data: WorkshopFormData) =>
    apiClient.post<ApiResponse<Workshop>>(API_ROUTES.WORKSHOPS.ADMIN_CREATE, data),

  updateWorkshop: (id: string, data: Partial<WorkshopFormData>) =>
    apiClient.put<ApiResponse<Workshop>>(API_ROUTES.WORKSHOPS.ADMIN_BY_ID(id), data),

  deleteWorkshop: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.WORKSHOPS.ADMIN_BY_ID(id)),

  // ── Admin: Experience ──────────────────────────────────────────────────────

  getAdminAllExperience: () =>
    apiClient.get<ApiResponse<WorkshopExperience[]>>(API_ROUTES.WORKSHOPS.ADMIN_EXPERIENCE_ALL),

  createExperience: (data: WorkshopExperienceFormData) =>
    apiClient.post<ApiResponse<WorkshopExperience>>(API_ROUTES.WORKSHOPS.ADMIN_EXPERIENCE_CREATE, data),

  updateExperience: (id: string, data: Partial<WorkshopExperienceFormData>) =>
    apiClient.put<ApiResponse<WorkshopExperience>>(API_ROUTES.WORKSHOPS.ADMIN_EXPERIENCE_BY_ID(id), data),

  deleteExperience: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.WORKSHOPS.ADMIN_EXPERIENCE_BY_ID(id)),

  // ── Admin: Inquiries ───────────────────────────────────────────────────────

  getAdminInquiries: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<WorkshopInquiry>>(API_ROUTES.WORKSHOPS.ADMIN_INQUIRIES, { params }),

  updateInquiryStatus: (id: string, status: WorkshopInquiryStatus) =>
    apiClient.patch<ApiResponse<WorkshopInquiry>>(API_ROUTES.WORKSHOPS.ADMIN_INQUIRY_STATUS(id), { status }),

  deleteInquiry: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.WORKSHOPS.ADMIN_INQUIRY_BY_ID(id)),
}

export default workshopApi
