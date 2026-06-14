import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import env from '@/config/env'
import API_ROUTES from '@/constants/apiRoutes'
import type { ApiResponse } from '@/types'
import { useAuthStore } from '@/store'

// ─── Axios Instance ─────────────────────────────────────────────────────────────
// Both access and refresh tokens live in secure httpOnly cookies.
// `withCredentials: true` ensures that these cookies travel with requests.

const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// ─── Refresh Queue ──────────────────────────────────────────────────────────────

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: any) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(null)
    }
  })
  failedQueue = []
}

// ─── Response Interceptor (silent refresh) ──────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status
    const url = originalRequest?.url || ''

    // Never attempt a refresh for auth endpoints themselves (e.g. a failed login
    // returns 401 — that should surface as an error, not a refresh loop).
    const isAuthRoute = url.includes('/auth/')

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      const isAuthenticated = useAuthStore.getState().isAuthenticated

      // If we are not authenticated in state, there is nothing to refresh.
      if (!isAuthenticated) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise<any>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => {
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Both tokens are automatically sent via cookies.
        await axios.post<ApiResponse>(
          `${env.API_BASE_URL}${API_ROUTES.AUTH.REFRESH}`,
          {},
          { withCredentials: true }
        )

        processQueue(null)
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        useAuthStore.getState().logout()
        // Avoid redirect loops if we are already on an auth page.
        if (!window.location.pathname.startsWith('/login')) {
          const redirect = encodeURIComponent(window.location.pathname + window.location.search)
          window.location.href = `/login?redirect=${redirect}`
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export { apiClient }
export default apiClient
