import { Navigate, useLocation } from 'react-router'
import { useAuthStore } from '@/store'
import { Loader } from '@/components/ui/loader'

// ─── Protected Route (Authenticated Users Only) ─────────────────────────────────

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return <Loader fullScreen text="Checking authentication..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
