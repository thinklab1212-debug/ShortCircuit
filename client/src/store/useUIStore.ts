import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme } from '@/types'

// ─── UI Store ───────────────────────────────────────────────────────────────────

type AuthModalView = 'login' | 'register'

interface UIState {
  theme: Theme
  isSidebarOpen: boolean
  isMobileMenuOpen: boolean
  isSearchOpen: boolean
  isCartDrawerOpen: boolean
  globalLoading: boolean
  isAuthModalOpen: boolean
  authModalView: AuthModalView

  // Actions
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
  toggleSearch: () => void
  setSearchOpen: (open: boolean) => void
  toggleCartDrawer: () => void
  setCartDrawerOpen: (open: boolean) => void
  setGlobalLoading: (loading: boolean) => void
  openAuthModal: (view?: AuthModalView) => void
  closeAuthModal: () => void
  setAuthModalView: (view: AuthModalView) => void
}

const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      isSidebarOpen: true,
      isMobileMenuOpen: false,
      isSearchOpen: false,
      isCartDrawerOpen: false,
      globalLoading: false,
      isAuthModalOpen: false,
      authModalView: 'login' as AuthModalView,

      setTheme: (theme) => {
        // Apply theme to document
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')

        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          root.classList.add(systemTheme)
        } else {
          root.classList.add(theme)
        }

        set({ theme })
      },

      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      setSidebarOpen: (isSidebarOpen) =>
        set({ isSidebarOpen }),

      toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

      setMobileMenuOpen: (isMobileMenuOpen) =>
        set({ isMobileMenuOpen }),

      toggleSearch: () =>
        set((state) => ({ isSearchOpen: !state.isSearchOpen })),

      setSearchOpen: (isSearchOpen) =>
        set({ isSearchOpen }),

      toggleCartDrawer: () =>
        set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),

      setCartDrawerOpen: (isCartDrawerOpen) =>
        set({ isCartDrawerOpen }),

      setGlobalLoading: (globalLoading) =>
        set({ globalLoading }),

      openAuthModal: (view = 'login') =>
        set({ isAuthModalOpen: true, authModalView: view }),

      closeAuthModal: () =>
        set({ isAuthModalOpen: false, authModalView: 'login' }),

      setAuthModalView: (authModalView) =>
        set({ authModalView }),
    }),
    {
      name: 'electrokart-ui',
      partialize: (state) => ({
        theme: state.theme,
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
)

export default useUIStore
