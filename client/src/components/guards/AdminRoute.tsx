import { Navigate } from 'react-router'
import { useAuthStore } from '@/store'
import { Loader } from '@/components/ui/loader'

// ─── Admin Route (Admin Only) ───────────────────────────────────────────────────

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) {
    return <Loader fullScreen text="Verifying access..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
