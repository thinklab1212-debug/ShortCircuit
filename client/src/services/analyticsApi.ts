import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type {
  ApiResponse,
  DashboardStats,
  RevenueDataPoint,
  OrderStats,
  TopProduct,
  TopCategory,
} from '@/types'

const analyticsApi = {
  dashboard: () => apiClient.get<ApiResponse<DashboardStats>>(API_ROUTES.ANALYTICS.DASHBOARD),

  revenue: () => apiClient.get<ApiResponse<RevenueDataPoint[]>>(API_ROUTES.ANALYTICS.REVENUE),

  orders: () => apiClient.get<ApiResponse<OrderStats>>(API_ROUTES.ANALYTICS.ORDERS),

  topProducts: (limit = 10) =>
    apiClient.get<ApiResponse<TopProduct[]>>(API_ROUTES.ANALYTICS.TOP_PRODUCTS, {
      params: { limit: String(limit) },
    }),

  topCategories: () => apiClient.get<ApiResponse<TopCategory[]>>(API_ROUTES.ANALYTICS.TOP_CATEGORIES),
}

export default analyticsApi
