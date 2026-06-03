import { Navigate } from 'react-router'
import { useAuthStore } from '@/store'

// ─── Guest Route (Unauthenticated Users Only) ───────────────────────────────────

interface GuestRouteProps {
  children: React.ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
