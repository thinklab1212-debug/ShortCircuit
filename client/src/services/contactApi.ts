import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse } from '@/types'

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

const contactApi = {
  sendMessage: (data: ContactFormData) =>
    apiClient.post<ApiResponse<null>>(API_ROUTES.CONTACT, data),
}

export default contactApi
