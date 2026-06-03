import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse, Address, AddressFormData } from '@/types'

const addressApi = {
  getAll: () => apiClient.get<ApiResponse<Address[]>>(API_ROUTES.ADDRESSES.BASE),

  create: (data: AddressFormData) =>
    apiClient.post<ApiResponse<Address>>(API_ROUTES.ADDRESSES.BASE, data),

  update: (id: string, data: Partial<AddressFormData>) =>
    apiClient.patch<ApiResponse<Address>>(API_ROUTES.ADDRESSES.BY_ID(id), data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.ADDRESSES.BY_ID(id)),

  setDefault: (id: string) =>
    apiClient.patch<ApiResponse<Address>>(API_ROUTES.ADDRESSES.SET_DEFAULT(id)),
}

export default addressApi
