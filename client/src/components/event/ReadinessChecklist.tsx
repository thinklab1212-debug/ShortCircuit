import { CheckCircle, AlertCircle, Clock, XCircle, Award } from 'lucide-react'
import type { Event } from '@/types'

interface ReadinessChecklistProps {
  event: Event
}

export function ReadinessChecklist({ event }: ReadinessChecklistProps) {
  // 1. Basic Information
  const isBasicInfoComplete = !!(
    event.eventName?.trim() &&
    event.description?.trim() &&
    event.banner?.url &&
    event.startDate &&
    event.endDate
  )

  // 2. Kit Configuration
  const isKitConfigured = !!(event.kitProducts && event.kitProducts.length > 0 && event.eventKitPrice > 0)

  // 3. Team List Uploaded
  const isTeamsUploaded = !!(event.teams && event.teams.length > 0)

  const statusIcons: Record<string, React.ReactNode> = {
    draft: <Clock className="h-4 w-4 text-muted-foreground" />,
    pending: <Clock className="h-4 w-4 text-warning" />,
    approved: <CheckCircle className="h-4 w-4 text-success" />,
    rejected: <XCircle className="h-4 w-4 text-destructive" />,
    completed: <Award className="h-4 w-4 text-primary" />,
  }

  const statusLabels: Record<string, string> = {
    draft: 'Draft (Setup In-progress)',
    pending: 'Awaiting Admin Approval',
    approved: 'Event Approved & Active',
    rejected: 'Event Rejected',
    completed: 'Event Completed',
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {/* Item 1 */}
        <div className="flex items-center justify-between text-sm rounded-lg border border-border p-2.5 bg-card">
          <span className="font-medium text-foreground">Basic Information</span>
          {isBasicInfoComplete ? (
            <span className="flex items-center gap-1 text-success text-xs font-semibold">
              <CheckCircle className="h-4 w-4" />
              Completed
            </span>
          ) : (
            <span className="flex items-center gap-1 text-warning text-xs font-semibold">
              <AlertCircle className="h-4 w-4" />
              Incomplete
            </span>
          )}
        </div>

        {/* Item 2 */}
        <div className="flex items-center justify-between text-sm rounded-lg border border-border p-2.5 bg-card">
          <span className="font-medium text-foreground">Event Kit Configured</span>
          {isKitConfigured ? (
            <span className="flex items-center gap-1 text-success text-xs font-semibold">
              <CheckCircle className="h-4 w-4" />
              Configured ({event.kitProducts?.length || 0} items)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-warning text-xs font-semibold">
              <AlertCircle className="h-4 w-4" />
              No Kit Items (Or ₹0 Price)
            </span>
          )}
        </div>

        {/* Item 3 */}
        <div className="flex items-center justify-between text-sm rounded-lg border border-border p-2.5 bg-card">
          <span className="font-medium text-foreground">Team List Uploaded</span>
          {isTeamsUploaded ? (
            <span className="flex items-center gap-1 text-success text-xs font-semibold">
              <CheckCircle className="h-4 w-4" />
              Uploaded ({event.totalTeams || event.teams?.length || 0} teams)
            </span>
          ) : (
            <span className="flex items-center gap-1 text-warning text-xs font-semibold">
              <AlertCircle className="h-4 w-4" />
              No Teams Uploaded
            </span>
          )}
        </div>
      </div>

      {/* Status Box */}
      <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">Workflow State</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {statusIcons[event.status] || <Clock className="h-4 w-4" />}
          {statusLabels[event.status] || event.status}
        </span>
      </div>
    </div>
  )
}
