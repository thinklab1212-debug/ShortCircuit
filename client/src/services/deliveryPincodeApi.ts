import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type {
  ApiResponse,
  PaginatedResponse,
  DeliveryPincode,
  DeliveryPincodeFormData,
  PincodeCheckResult,
} from '@/types'

const deliveryPincodeApi = {
  // Customer: public pincode check
  check: (pincode: string) =>
    apiClient.post<ApiResponse<PincodeCheckResult>>(API_ROUTES.DELIVERY_PINCODES.CHECK, { pincode }),

  // Admin: list all (paginated, searchable)
  adminGetAll: (params?: { page?: number; limit?: number; search?: string; isActive?: string }) =>
    apiClient.get<PaginatedResponse<DeliveryPincode>>(API_ROUTES.DELIVERY_PINCODES.ADMIN, { params }),

  // Admin: create
  adminCreate: (data: DeliveryPincodeFormData) =>
    apiClient.post<ApiResponse<DeliveryPincode>>(API_ROUTES.DELIVERY_PINCODES.ADMIN, data),

  // Admin: update
  adminUpdate: (id: string, data: Partial<DeliveryPincodeFormData>) =>
    apiClient.put<ApiResponse<DeliveryPincode>>(API_ROUTES.DELIVERY_PINCODES.ADMIN_BY_ID(id), data),

  // Admin: toggle status
  adminToggleStatus: (id: string, isActive: boolean) =>
    apiClient.patch<ApiResponse<DeliveryPincode>>(API_ROUTES.DELIVERY_PINCODES.ADMIN_STATUS(id), { isActive }),

  // Admin: delete
  adminDelete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.DELIVERY_PINCODES.ADMIN_BY_ID(id)),
}

export default deliveryPincodeApi
