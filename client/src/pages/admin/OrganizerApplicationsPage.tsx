import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building2,
  Mail,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  useOrganizerApplications,
  useApproveOrganizerApplication,
  useRejectOrganizerApplication,
} from '@/hooks'
import { fadeInUp, staggerContainer } from '@/config/animations'
import type { OrganizerApplication, User } from '@/types'

// ─── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-warning/10 text-warning',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
  }
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-3 w-3" />,
    approved: <CheckCircle className="h-3 w-3" />,
    rejected: <XCircle className="h-3 w-3" />,
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] || ''}`}>
      {icons[status]}
      {status}
    </span>
  )
}

// ─── Application Detail Modal ───────────────────────────────────────────────────

function ApplicationDetailPanel({
  application,
  onClose,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  application: OrganizerApplication
  onClose: () => void
  onApprove: (id: string, response?: string) => void
  onReject: (id: string, response?: string) => void
  isApproving: boolean
  isRejecting: boolean
}) {
  const [adminResponse, setAdminResponse] = useState('')
  const user = application.user as User

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Application Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Applicant Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Applicant
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user?.email}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Organization Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Organization
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{application.organizationName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{application.collegeName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{application.contactNumber}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <StatusBadge status={application.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Applied On</span>
            <span className="text-sm">{new Date(application.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>

          {application.adminResponse && (
            <>
              <Separator />
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase">Admin Response</span>
                <p className="text-sm text-foreground bg-muted rounded-lg p-2.5">{application.adminResponse}</p>
              </div>
            </>
          )}

          {/* Action Buttons (only for pending applications) */}
          {application.status === 'pending' && (
            <>
              <Separator />
              <div className="space-y-3">
                <Input
                  placeholder="Admin response (optional)..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                    loading={isRejecting}
                    loadingText="Rejecting..."
                    onClick={() => onReject(application._id, adminResponse || undefined)}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1"
                    loading={isApproving}
                    loadingText="Approving..."
                    onClick={() => onApprove(application._id, adminResponse || undefined)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Approve
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function OrganizerApplicationsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedApp, setSelectedApp] = useState<OrganizerApplication | null>(null)

  const { data, isLoading } = useOrganizerApplications({
    page,
    limit: 10,
    status: statusFilter || undefined,
  })
  const approveApp = useApproveOrganizerApplication()
  const rejectApp = useRejectOrganizerApplication()

  const applications = data?.applications || []
  const pagination = data?.pagination

  const handleApprove = (id: string, response?: string) => {
    approveApp.mutate(
      { id, adminResponse: response },
      { onSuccess: () => setSelectedApp(null) }
    )
  }

  const handleReject = (id: string, response?: string) => {
    rejectApp.mutate(
      { id, adminResponse: response },
      { onSuccess: () => setSelectedApp(null) }
    )
  }

  const statusFilters = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-display-xs font-heading text-foreground">Organizer Applications</h1>
        <p className="mt-1 text-body-md text-muted-foreground">
          Review and manage organizer applications from users who want to sell event kits.
        </p>
      </div>

      {/* Filters */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate">
        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                {statusFilters.map((f) => (
                  <Button
                    key={f.value}
                    variant={statusFilter === f.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setStatusFilter(f.value)
                      setPage(1)
                    }}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Selected Application Detail */}
        {selectedApp && (
          <div className="mt-4">
            <ApplicationDetailPanel
              application={selectedApp}
              onClose={() => setSelectedApp(null)}
              onApprove={handleApprove}
              onReject={handleReject}
              isApproving={approveApp.isPending}
              isRejecting={rejectApp.isPending}
            />
          </div>
        )}

        {/* Applications Table */}
        <motion.div variants={fadeInUp} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Applications
                {pagination && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({pagination.totalResults} total)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium">No applications found</p>
                  <p className="text-sm mt-1">
                    {statusFilter ? `No ${statusFilter} applications.` : 'No organizer applications have been submitted yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 font-medium text-muted-foreground">Applicant</th>
                        <th className="pb-3 font-medium text-muted-foreground">Organization</th>
                        <th className="pb-3 font-medium text-muted-foreground">College</th>
                        <th className="pb-3 font-medium text-muted-foreground">Status</th>
                        <th className="pb-3 font-medium text-muted-foreground">Date</th>
                        <th className="pb-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {applications.map((app) => {
                        const appUser = app.user as User
                        return (
                          <tr key={app._id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3">
                              <div>
                                <p className="font-medium">{appUser?.firstName} {appUser?.lastName}</p>
                                <p className="text-xs text-muted-foreground">{appUser?.email}</p>
                              </div>
                            </td>
                            <td className="py-3">{app.organizationName}</td>
                            <td className="py-3 max-w-[150px] truncate">{app.collegeName}</td>
                            <td className="py-3">
                              <StatusBadge status={app.status} />
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className="py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedApp(app)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
