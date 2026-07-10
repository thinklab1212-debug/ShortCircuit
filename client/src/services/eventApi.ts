import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse, PaginatedResponse, Event, EventTeam, EventOrder } from '@/types'

// ─── Organizer: Event Management API ────────────────────────────────────────────

export interface CreateEventData {
  eventName: string
  collegeName: string
  description: string
  banner: { url: string; publicId: string }
  startDate: string
  endDate: string
  eventKitPrice: number
  kitProducts: {
    product: string
    productName: string
    priceAtCreation: number
    quantity: number
  }[]
}

const eventApi = {
  create: (data: CreateEventData) =>
    apiClient.post<ApiResponse<Event>>(API_ROUTES.ORGANIZER.EVENTS, data),

  getMyEvents: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<Event>>(API_ROUTES.ORGANIZER.EVENTS, { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Event>>(API_ROUTES.ORGANIZER.EVENT_BY_ID(id)),

  update: (id: string, data: Partial<CreateEventData>) =>
    apiClient.patch<ApiResponse<Event>>(API_ROUTES.ORGANIZER.EVENT_BY_ID(id), data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.ORGANIZER.EVENT_BY_ID(id)),

  submitForReview: (id: string) =>
    apiClient.patch<ApiResponse<Event>>(API_ROUTES.ORGANIZER.EVENT_SUBMIT(id)),

  // ── Team Management & CSV Import (Phase 5) ──
  previewTeams: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post<ApiResponse<{ teamId: string; leaderName: string; status: string }[]>>(
      API_ROUTES.ORGANIZER.TEAMS_PREVIEW(id),
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  importTeams: (id: string, teams: { teamId: string; leaderName: string }[]) =>
    apiClient.post<ApiResponse<{ importedCount: number; skippedCount: number; errors: any[] }>>(
      API_ROUTES.ORGANIZER.TEAMS_IMPORT(id),
      { teams }
    ),

  getTeams: (id: string, params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    apiClient.get<PaginatedResponse<{ teams: EventTeam[]; stats: { totalTeams: number; purchasedTeams: number; remainingTeams: number } }>>(
      API_ROUTES.ORGANIZER.TEAMS(id),
      { params }
    ),

  updateTeam: (id: string, teamId: string, leaderName: string) =>
    apiClient.patch<ApiResponse<EventTeam>>(
      API_ROUTES.ORGANIZER.TEAM_BY_ID(id, teamId),
      { leaderName }
    ),

  deleteTeam: (id: string, teamId: string) =>
    apiClient.delete<ApiResponse<null>>(
      API_ROUTES.ORGANIZER.TEAM_BY_ID(id, teamId)
    ),

  clearTeams: (id: string) =>
    apiClient.delete<ApiResponse<null>>(
      API_ROUTES.ORGANIZER.TEAMS(id)
    ),

  // ── Admin Event Review (Phase 6) ──
  adminGetAllEvents: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<Event>>(API_ROUTES.ADMIN_EVENTS.BASE, { params }),

  adminGetEventById: (id: string) =>
    apiClient.get<ApiResponse<Event>>(API_ROUTES.ADMIN_EVENTS.BY_ID(id)),

  adminApproveEvent: (id: string) =>
    apiClient.patch<ApiResponse<Event>>(API_ROUTES.ADMIN_EVENTS.APPROVE(id)),

  adminRejectEvent: (id: string, rejectionReason: string) =>
    apiClient.patch<ApiResponse<Event>>(API_ROUTES.ADMIN_EVENTS.REJECT(id), { rejectionReason }),

  // ── Public & Student Event Operations (Phase 7) ──
  getPublicEvents: (params?: { page?: number; limit?: number; search?: string; sortBy?: string }) =>
    apiClient.get<PaginatedResponse<Event>>(API_ROUTES.PUBLIC_EVENTS.BASE, { params }),

  getPublicEventBySlug: (slug: string) =>
    apiClient.get<ApiResponse<Event>>(API_ROUTES.PUBLIC_EVENTS.BY_SLUG(slug)),

  verifyTeam: (eventId: string, teamId: string) =>
    apiClient.post<ApiResponse<{ teamId: string; leaderName: string; token: string }>>(
      API_ROUTES.PUBLIC_EVENTS.VERIFY_TEAM(eventId),
      { teamId }
    ),

  checkoutEventKit: (eventId: string, token: string) =>
    apiClient.get<ApiResponse<any>>(API_ROUTES.PUBLIC_EVENTS.CHECKOUT(eventId), {
      headers: { 'x-verification-token': token },
      params: { token }, // pass both for robustness
    }),

  purchaseEventKit: (
    eventId: string,
    data: {
      verificationToken: string
      addressId: string
      paymentMethod: 'razorpay' | 'cod'
      orderId?: string
      paymentDetails?: {
        razorpayOrderId?: string
        razorpayPaymentId?: string
        razorpaySignature?: string
      }
    }
  ) =>
    apiClient.post<ApiResponse<any>>(API_ROUTES.PUBLIC_EVENTS.PURCHASE(eventId), data),

  getOrganizerEventPurchases: (
    eventId: string,
    params?: { page?: number; limit?: number; search?: string; paymentStatus?: string }
  ) =>
    apiClient.get<PaginatedResponse<EventOrder>>(API_ROUTES.ORGANIZER.PURCHASES(eventId), { params }),

  getAdminEventOrders: (params?: {
    page?: number
    limit?: number
    eventId?: string
    organizerId?: string
    paymentStatus?: string
    deliveryStatus?: string
  }) =>
    apiClient.get<PaginatedResponse<EventOrder>>(API_ROUTES.ADMIN_EVENTS.ORDERS, { params }),

  getCustomerEventOrders: () =>
    apiClient.get<ApiResponse<EventOrder[]>>(API_ROUTES.PUBLIC_EVENTS.MY_ORDERS),
}

export default eventApi
