import apiClient from '@/api/apiClient'
import API_ROUTES from '@/constants/apiRoutes'
import type {
  ApiResponse,
  User,
  LoginResponse,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData,
} from '@/types'

// ─── Auth API Service ───────────────────────────────────────────────────────────

const authApi = {
  login: (data: LoginCredentials) =>
    apiClient.post<ApiResponse<LoginResponse>>(API_ROUTES.AUTH.LOGIN, data),

  register: (data: RegisterData) =>
    apiClient.post<ApiResponse<User>>(API_ROUTES.AUTH.REGISTER, data),

  logout: () => apiClient.post<ApiResponse<null>>(API_ROUTES.AUTH.LOGOUT),

  forgotPassword: (data: ForgotPasswordData) =>
    apiClient.post<ApiResponse<null>>(API_ROUTES.AUTH.FORGOT_PASSWORD, data),

  resetPassword: (token: string, data: ResetPasswordData) =>
    apiClient.post<ApiResponse<null>>(API_ROUTES.AUTH.RESET_PASSWORD(token), data),

  changePassword: (data: ChangePasswordData) =>
    apiClient.patch<ApiResponse<null>>(API_ROUTES.AUTH.CHANGE_PASSWORD, data),

  /** Current authenticated user (GET /users/me) */
  getMe: () => apiClient.get<ApiResponse<User>>(API_ROUTES.USERS.ME),
}

export default authApi
