import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse, RazorpayOrderResponse, VerifyPaymentData } from '@/types'

const paymentApi = {
  createOrder: (data: { orderId: string; amount: number }) =>
    apiClient.post<ApiResponse<RazorpayOrderResponse>>(API_ROUTES.PAYMENTS.CREATE_ORDER, data),

  verify: (data: VerifyPaymentData) =>
    apiClient.post<ApiResponse<{ orderId: string; paymentStatus: string; orderStatus: string }>>(
      API_ROUTES.PAYMENTS.VERIFY,
      data
    ),
}

export default paymentApi
