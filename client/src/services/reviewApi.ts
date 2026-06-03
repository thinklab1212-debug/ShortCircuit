import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse, PaginatedResponse, Review, ReviewFormData } from '@/types'

const reviewApi = {
  getByProduct: (productId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Review>>(API_ROUTES.REVIEWS.BY_PRODUCT(productId), { params }),

  create: (productId: string, data: ReviewFormData) =>
    apiClient.post<ApiResponse<Review>>(API_ROUTES.REVIEWS.BY_PRODUCT(productId), data),

  update: (productId: string, reviewId: string, data: Partial<ReviewFormData>) =>
    apiClient.patch<ApiResponse<Review>>(API_ROUTES.REVIEWS.ONE(productId, reviewId), data),

  remove: (productId: string, reviewId: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.REVIEWS.ONE(productId, reviewId)),
}

export default reviewApi
