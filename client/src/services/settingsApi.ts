import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse } from '@/types'

export interface PublicSettings {
  isMaintenanceMode: boolean
  maintenanceTitle: string
  maintenanceMessage: string
  maintenanceETA?: string
  codEnabled: boolean
  guestCheckoutEnabled: boolean
}

export interface SystemSettingsData {
  _id: string
  isMaintenanceMode: boolean
  maintenanceTitle: string
  maintenanceMessage: string
  maintenanceETA?: string
  codEnabled: boolean
  guestCheckoutEnabled: boolean
  emailNotificationsEnabled: boolean
  createdAt: string
  updatedAt: string
}

const settingsApi = {
  getPublic: () => apiClient.get<ApiResponse<PublicSettings>>(API_ROUTES.SETTINGS.PUBLIC),

  getAdmin: () => apiClient.get<ApiResponse<SystemSettingsData>>(API_ROUTES.SETTINGS.ADMIN),

  updateAdmin: (data: Partial<SystemSettingsData>) =>
    apiClient.patch<ApiResponse<SystemSettingsData>>(API_ROUTES.SETTINGS.ADMIN, data),
}

export default settingsApi
