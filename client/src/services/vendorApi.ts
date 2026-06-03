import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type {
  ApiResponse,
  PaginatedResponse,
  Product,
  VendorProfile,
  VendorDashboardStats,
  CreateVendorData,
  VendorProductFormData,
  ReviewProductData,
  User,
} from '@/types'

// ─── Vendor Self-Service API ────────────────────────────────────────────────────

export const vendorApi = {
  // Profile
  getProfile: () =>
    apiClient.get<ApiResponse<VendorProfile>>(API_ROUTES.VENDOR.PROFILE),

  updateProfile: (data: Partial<VendorProfile>) =>
    apiClient.put<ApiResponse<VendorProfile>>(API_ROUTES.VENDOR.PROFILE, data),

  // Dashboard
  getDashboard: () =>
    apiClient.get<ApiResponse<VendorDashboardStats>>(API_ROUTES.VENDOR.DASHBOARD),

  // Products
  getProducts: (params?: { page?: number; limit?: number; approvalStatus?: string }) =>
    apiClient.get<PaginatedResponse<Product>>(API_ROUTES.VENDOR.PRODUCTS, { params }),

  getProduct: (id: string) =>
    apiClient.get<ApiResponse<Product>>(API_ROUTES.VENDOR.PRODUCT_BY_ID(id)),

  createProduct: (data: VendorProductFormData) =>
    apiClient.post<ApiResponse<Product>>(API_ROUTES.VENDOR.PRODUCTS, data),

  updateProduct: (id: string, data: Partial<VendorProductFormData>) =>
    apiClient.patch<ApiResponse<Product>>(API_ROUTES.VENDOR.PRODUCT_BY_ID(id), data),

  deleteProduct: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.VENDOR.PRODUCT_BY_ID(id)),

  submitForReview: (id: string) =>
    apiClient.patch<ApiResponse<Product>>(API_ROUTES.VENDOR.SUBMIT(id)),
}

// ─── Admin Vendor Management API ────────────────────────────────────────────────

export const adminVendorApi = {
  // Vendor Management
  getVendors: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<VendorProfile>>(API_ROUTES.ADMIN_VENDORS.BASE, { params }),

  getVendor: (id: string) =>
    apiClient.get<ApiResponse<VendorProfile>>(API_ROUTES.ADMIN_VENDORS.BY_ID(id)),

  createVendor: (data: CreateVendorData) =>
    apiClient.post<ApiResponse<{ user: User; profile: VendorProfile }>>(
      API_ROUTES.ADMIN_VENDORS.BASE,
      data
    ),

  // Product Review
  getReviewQueue: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Product>>(API_ROUTES.ADMIN_VENDORS.REVIEW_QUEUE, { params }),

  reviewProduct: (id: string, data: ReviewProductData) =>
    apiClient.patch<ApiResponse<Product>>(API_ROUTES.ADMIN_VENDORS.REVIEW(id), data),
}

export default vendorApi
