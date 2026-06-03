import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type {
  ApiResponse,
  PaginatedResponse,
  Coupon,
  CouponFormData,
  ValidateCouponData,
  CouponValidationResult,
} from '@/types'

const couponApi = {
  validate: (data: ValidateCouponData) =>
    apiClient.post<ApiResponse<CouponValidationResult>>(API_ROUTES.COUPONS.VALIDATE, data),

  // ── Admin ──
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Coupon>>(API_ROUTES.COUPONS.ADMIN, { params }),

  create: (data: CouponFormData) =>
    apiClient.post<ApiResponse<Coupon>>(API_ROUTES.COUPONS.ADMIN, data),

  update: (id: string, data: Partial<CouponFormData>) =>
    apiClient.patch<ApiResponse<Coupon>>(API_ROUTES.COUPONS.ADMIN_BY_ID(id), data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.COUPONS.ADMIN_BY_ID(id)),
}

export default couponApi
