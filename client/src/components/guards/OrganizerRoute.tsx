import { Navigate } from 'react-router'
import { useAuthStore } from '@/store'
import { Loader } from '@/components/ui/loader'

// ─── Organizer Route (Organizer Only) ───────────────────────────────────────────

interface OrganizerRouteProps {
  children: React.ReactNode
}

export function OrganizerRoute({ children }: OrganizerRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) {
    return <Loader fullScreen text="Verifying access..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user?.isOrganizer) {
    return <Navigate to="/profile" replace />
  }

  return <>{children}</>
}
