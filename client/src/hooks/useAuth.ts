import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router'
import toast from 'react-hot-toast'
import authApi from '@/services/authApi'
import { useAuthStore } from '@/store'
import { getAccessToken } from '@/api/apiClient'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/types'

// ─── Error Helper ───────────────────────────────────────────────────────────────

function getErrorMessage(error: AxiosError<ApiResponse>): string {
  return error.response?.data?.message || error.message || 'Something went wrong'
}

// ─── Auth Bootstrap ─────────────────────────────────────────────────────────────
// Runs once on app mount: hydrates the user from the server (validating any
// persisted session) and flips isLoading/isInitialized so guards can resolve.

export function useInitAuth() {
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const setLoading = useAuthStore((s) => s.setLoading)
  const setInitialized = useAuthStore((s) => s.setInitialized)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      // No persisted session and no token → nothing to restore.
      if (!isAuthenticated && !getAccessToken()) {
        setLoading(false)
        setInitialized(true)
        return
      }

      try {
        const res = await authApi.getMe()
        if (active) {
          setUser(res.data.data)
          setLoading(false)
          setInitialized(true)
        }
      } catch {
        if (active) {
          logout()
        }
      }
    }

    void bootstrap()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// ─── Login Mutation ─────────────────────────────────────────────────────────────

export function useLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      const { user, accessToken } = res.data.data
      login(user, accessToken)
      toast.success(`Welcome back, ${user.firstName}!`)

      const params = new URLSearchParams(location.search)
      const redirect = params.get('redirect')
      const fromState = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      const destination = redirect || fromState || (user.role === 'admin' ? '/admin' : '/')
      navigate(destination, { replace: true })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      toast.error(getErrorMessage(error))
    },
  })
}

// ─── Register Mutation ──────────────────────────────────────────────────────────
// Registration does NOT issue a session; the user must sign in afterwards.

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success('Account created! Please sign in to continue.')
      navigate('/login', { replace: true })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      toast.error(getErrorMessage(error))
    },
  })
}

// ─── Logout Mutation ────────────────────────────────────────────────────────────

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout()
      toast.success('Signed out successfully')
      navigate('/login', { replace: true })
    },
    onError: () => {
      logout()
      navigate('/login', { replace: true })
    },
  })
}

// ─── Forgot Password Mutation ───────────────────────────────────────────────────

export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      toast.success('If that email exists, a reset link is on its way.')
    },
    onError: (error: AxiosError<ApiResponse>) => {
      toast.error(getErrorMessage(error))
    },
  })
}

// ─── Reset Password Mutation ────────────────────────────────────────────────────

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ token, data }: { token: string; data: { password: string; confirmPassword: string } }) =>
      authApi.resetPassword(token, data),
    onSuccess: () => {
      toast.success('Password reset successful! Please sign in.')
      navigate('/login', { replace: true })
    },
    onError: (error: AxiosError<ApiResponse>) => {
      toast.error(getErrorMessage(error))
    },
  })
}

// ─── Change Password Mutation ───────────────────────────────────────────────────

export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Password updated successfully')
    },
    onError: (error: AxiosError<ApiResponse>) => {
      toast.error(getErrorMessage(error))
    },
  })
}
