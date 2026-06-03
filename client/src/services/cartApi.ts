import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse, Cart, CartTotals, AddToCartData } from '@/types'

const cartApi = {
  get: () => apiClient.get<ApiResponse<Cart>>(API_ROUTES.CART.BASE),

  addItem: (data: AddToCartData) =>
    apiClient.post<ApiResponse<Cart>>(API_ROUTES.CART.ITEMS, data),

  updateItem: (itemId: string, quantity: number) =>
    apiClient.patch<ApiResponse<Cart>>(API_ROUTES.CART.ITEM(itemId), { quantity }),

  removeItem: (itemId: string) =>
    apiClient.delete<ApiResponse<Cart>>(API_ROUTES.CART.ITEM(itemId)),

  clear: () => apiClient.delete<ApiResponse<null>>(API_ROUTES.CART.BASE),

  getTotals: (couponCode?: string) =>
    apiClient.get<ApiResponse<CartTotals>>(API_ROUTES.CART.TOTALS, {
      params: couponCode ? { couponCode } : undefined,
    }),
}

export default cartApi
