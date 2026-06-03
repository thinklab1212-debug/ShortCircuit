import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse, Wishlist } from '@/types'

const wishlistApi = {
  get: () => apiClient.get<ApiResponse<Wishlist>>(API_ROUTES.WISHLIST.BASE),

  toggle: (productId: string) =>
    apiClient.post<ApiResponse<Wishlist>>(API_ROUTES.WISHLIST.TOGGLE(productId)),

  remove: (productId: string) =>
    apiClient.delete<ApiResponse<Wishlist>>(API_ROUTES.WISHLIST.REMOVE(productId)),
}

export default wishlistApi
