import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type {
  ApiResponse,
  PaginatedResponse,
  Order,
  CreateOrderData,
  UpdateOrderStatusData,
  TrackingUpdateData,
} from '@/types'

const orderApi = {
  place: (data: CreateOrderData) =>
    apiClient.post<ApiResponse<Order>>(API_ROUTES.ORDERS.BASE, data),

  getMyOrders: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Order>>(API_ROUTES.ORDERS.BASE, { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Order>>(API_ROUTES.ORDERS.BY_ID(id)),

  cancel: (id: string, cancellationReason: string) =>
    apiClient.patch<ApiResponse<Order>>(API_ROUTES.ORDERS.CANCEL(id), { cancellationReason }),

  getInvoice: (id: string) =>
    apiClient.get<Blob>(API_ROUTES.ORDERS.INVOICE(id), { responseType: 'blob' }),

  getInvoiceSettings: () =>
    apiClient.get<ApiResponse<any>>(API_ROUTES.INVOICE_SETTINGS.BASE),

  updateInvoiceSettings: (data: any) =>
    apiClient.put<ApiResponse<any>>(API_ROUTES.INVOICE_SETTINGS.BASE, data),

  getInvoicePreview: () =>
    apiClient.get<Blob>(API_ROUTES.INVOICE_SETTINGS.PREVIEW, { responseType: 'blob' }),

  // ── Admin ──
  getAll: (params?: { page?: number; limit?: number; orderStatus?: string; paymentStatus?: string; search?: string }) =>
    apiClient.get<PaginatedResponse<Order>>(API_ROUTES.ORDERS.ADMIN_ALL, { params }),

  getAdminById: (id: string) =>
    apiClient.get<ApiResponse<Order>>(API_ROUTES.ORDERS.ADMIN_BY_ID(id)),

  updateStatus: (id: string, data: UpdateOrderStatusData) =>
    apiClient.patch<ApiResponse<Order>>(API_ROUTES.ORDERS.ADMIN_STATUS(id), data),

  updateTracking: (id: string, data: TrackingUpdateData) =>
    apiClient.patch<ApiResponse<Order>>(API_ROUTES.ORDERS.ADMIN_TRACKING(id), data),
}

export default orderApi
