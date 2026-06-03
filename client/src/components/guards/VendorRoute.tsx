import { Navigate } from 'react-router'
import { useAuthStore } from '@/store'
import { Loader } from '@/components/ui/loader'

// ─── Vendor Route (Vendor Only) ─────────────────────────────────────────────────

interface VendorRouteProps {
  children: React.ReactNode
}

export function VendorRoute({ children }: VendorRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) {
    return <Loader fullScreen text="Verifying access..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'vendor') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
