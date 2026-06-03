import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { clearTokens, setAccessToken } from '@/api/apiClient'

// ─── Auth Store ─────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean

  // Actions
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  login: (user: User, accessToken: string) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setLoading: (isLoading) => set({ isLoading }),

      setInitialized: (isInitialized) => set({ isInitialized }),

      login: (user, accessToken) => {
        setAccessToken(accessToken)
        set({ user, isAuthenticated: true, isLoading: false, isInitialized: true })
      },

      logout: () => {
        clearTokens()
        set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true })
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'electrokart-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
