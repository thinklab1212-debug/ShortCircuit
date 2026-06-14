import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse, UploadResponse } from '@/types'

const uploadApi = {
  image: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return apiClient.post<ApiResponse<UploadResponse>>(API_ROUTES.UPLOADS.IMAGE, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  pdf: (file: File) => {
    const form = new FormData()
    form.append('pdf', file)
    return apiClient.post<ApiResponse<UploadResponse>>(API_ROUTES.UPLOADS.PDF, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  images: (files: File[]) => {
    const form = new FormData()
    files.forEach((file) => form.append('images', file))
    return apiClient.post<ApiResponse<UploadResponse[]>>(API_ROUTES.UPLOADS.IMAGES, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  remove: (publicId: string) =>
    apiClient.delete<ApiResponse<null>>(API_ROUTES.UPLOADS.DELETE(publicId)),
}

export default uploadApi
