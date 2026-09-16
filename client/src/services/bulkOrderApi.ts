import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type {
  ApiResponse,
  PaginatedResponse,
  BulkOrderQuote,
  BulkOrderFormData,
  BulkOrderStatus,
  BulkOrderStats,
} from '@/types'

const bulkOrderApi = {
  // ── Public ─────────────────────────────────────────────────────────────────

  /** Submit a bulk order / quotation request */
  submitQuoteRequest: (data: BulkOrderFormData) =>
    apiClient.post<ApiResponse<BulkOrderQuote>>(API_ROUTES.BULK_ORDERS.CREATE, data),

  // ── Admin ──────────────────────────────────────────────────────────────────

  /** Fetch quotes with status filter, search, and pagination */
  getAdminQuotes: (params?: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }) =>
    apiClient.get<PaginatedResponse<BulkOrderQuote>>(API_ROUTES.BULK_ORDERS.ADMIN_ALL, {
      params,
    }),

  /** Get quotation counts for dashboard tabs/badges */
  getAdminStats: () =>
    apiClient.get<ApiResponse<BulkOrderStats>>(API_ROUTES.BULK_ORDERS.ADMIN_STATS),

  /** Get single quotation detail */
  getAdminQuoteById: (id: string) =>
    apiClient.get<ApiResponse<BulkOrderQuote>>(API_ROUTES.BULK_ORDERS.ADMIN_BY_ID(id)),

  /** Update quotation status, internal notes, or quoted amount */
  updateQuoteStatus: (
    id: string,
    data: {
      status: BulkOrderStatus
      adminNotes?: string
      quotedAmount?: number
    }
  ) =>
    apiClient.patch<ApiResponse<BulkOrderQuote>>(
      API_ROUTES.BULK_ORDERS.ADMIN_STATUS(id),
      data
    ),

  /** Delete quotation record */
  deleteQuote: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.BULK_ORDERS.ADMIN_DELETE(id)),
}

export default bulkOrderApi
