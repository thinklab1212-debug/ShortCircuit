import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Eye,
  Trash2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { workshopApi } from '@/services'
import { DataTable, AdminPageHeader } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader } from '@/components/ui/loader'
import { ErrorFallback } from '@/components/ui/error'
import { modalOverlayVariants, modalContentVariants } from '@/config/animations'
import type { WorkshopInquiry, WorkshopInquiryStatus } from '@/types'

const STATUSES: ('All' | WorkshopInquiryStatus)[] = [
  'All',
  'New',
  'Contacted',
  'Confirmed',
  'Completed',
  'Cancelled',
]

const statusStyles: Record<WorkshopInquiryStatus, string> = {
  New: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  Contacted: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  Confirmed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  Completed: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  Cancelled: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
}

export default function AdminWorkshopInquiriesPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'All' | WorkshopInquiryStatus>('All')
  const [selectedInquiry, setSelectedInquiry] = useState<WorkshopInquiry | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'workshop-inquiries', statusFilter],
    queryFn: async () => {
      const res = await workshopApi.getAdminInquiries({
        status: statusFilter === 'All' ? undefined : statusFilter,
        limit: 50,
      })
      return res.data
    },
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'workshop-inquiries'] })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkshopInquiryStatus }) =>
      workshopApi.updateInquiryStatus(id, status),
    onSuccess: (res) => {
      toast.success('Inquiry status updated')
      invalidate()
      if (selectedInquiry?._id === res.data.data._id) {
        setSelectedInquiry(res.data.data)
      }
    },
    onError: () => toast.error('Failed to update status'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workshopApi.deleteInquiry(id),
    onSuccess: () => {
      toast.success('Inquiry deleted')
      invalidate()
      if (selectedInquiry) setSelectedInquiry(null)
    },
    onError: () => toast.error('Failed to delete inquiry'),
  })

  const handleDelete = (inquiry: WorkshopInquiry) => {
    if (window.confirm(`Delete inquiry from "${inquiry.institutionName}"?`)) {
      deleteMutation.mutate(inquiry._id)
    }
  }

  const columns = [
    {
      key: 'institution',
      header: 'Institution',
      render: (row: WorkshopInquiry) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground block">{row.institutionName}</span>
          <span className="text-xs text-muted-foreground">
            {row.institutionType} • {row.location}
          </span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Person',
      render: (row: WorkshopInquiry) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-medium text-foreground block">{row.contactPerson}</span>
          <span className="text-muted-foreground block">{row.email}</span>
          <span className="text-muted-foreground block font-mono">{row.phone}</span>
        </div>
      ),
    },
    {
      key: 'workshopArea',
      header: 'Requirement',
      render: (row: WorkshopInquiry) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-semibold text-primary block">{row.workshopArea}</span>
          <span className="text-muted-foreground">{row.expectedStudents} students</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: WorkshopInquiry) => (
        <select
          value={row.status}
          onChange={(e) =>
            updateStatusMutation.mutate({
              id: row._id,
              status: e.target.value as WorkshopInquiryStatus,
            })
          }
          className={`h-7 px-2 text-xs font-semibold rounded-md border focus:outline-none cursor-pointer ${
            statusStyles[row.status]
          }`}
        >
          {STATUSES.filter((s): s is WorkshopInquiryStatus => s !== 'All').map((st) => (
            <option key={st} value={st} className="bg-popover text-popover-foreground">
              {st}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row: WorkshopInquiry) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row: WorkshopInquiry) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSelectedInquiry(row)}
            aria-label="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(row)}
            aria-label="Delete"
            className="text-error-500 hover:text-error-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (isLoading) return <Loader fullScreen text="Loading inquiries..." />
  if (isError) return <ErrorFallback error={error as Error} resetErrorBoundary={refetch} />

  const inquiries = data?.data || []

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Workshop Inquiries"
        description="Review campus workshop requests from schools, colleges, and student organizations."
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border">
        {STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              statusFilter === status
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns as never}
        data={(inquiries ?? []) as never}
        isLoading={isLoading}
        emptyMessage={`No ${statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} inquiries found.`}
      />

      {/* View Detail Modal */}
      <AnimatePresence>
        {selectedInquiry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalOverlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedInquiry(null)}
            />
            <motion.div
              variants={modalContentVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5"
            >
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <Badge variant="outline" className={`mb-1.5 ${statusStyles[selectedInquiry.status]}`}>
                    {selectedInquiry.status}
                  </Badge>
                  <h2 className="text-lg font-bold font-heading text-foreground">
                    {selectedInquiry.institutionName}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Submitted on {new Date(selectedInquiry.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelectedInquiry(null)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Institution & Contact Info */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/40 p-3.5 rounded-xl border border-border/60">
                <div>
                  <span className="text-xs text-muted-foreground block">Institution Type</span>
                  <span className="font-medium text-foreground">{selectedInquiry.institutionType}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Location / City</span>
                  <span className="font-medium text-foreground">{selectedInquiry.location}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Contact Person</span>
                  <span className="font-medium text-foreground">{selectedInquiry.contactPerson}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Phone</span>
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {selectedInquiry.phone}
                  </a>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground block">Email</span>
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="font-medium text-primary hover:underline break-all"
                  >
                    {selectedInquiry.email}
                  </a>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground block">Requested Area</span>
                    <span className="font-semibold text-primary">{selectedInquiry.workshopArea}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Expected Students</span>
                    <span className="font-medium text-foreground">{selectedInquiry.expectedStudents}</span>
                  </div>
                </div>

                {selectedInquiry.preferredDate && (
                  <div>
                    <span className="text-xs text-muted-foreground block">Preferred Date</span>
                    <span className="font-medium text-foreground">
                      {new Date(selectedInquiry.preferredDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {selectedInquiry.message && (
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <span className="text-xs font-semibold text-foreground block mb-1">
                      Requirements / Message:
                    </span>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedInquiry.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Updater */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Change Status:</span>
                  <select
                    value={selectedInquiry.status}
                    onChange={(e) =>
                      updateStatusMutation.mutate({
                        id: selectedInquiry._id,
                        status: e.target.value as WorkshopInquiryStatus,
                      })
                    }
                    className={`h-8 px-2.5 text-xs font-semibold rounded-md border focus:outline-none cursor-pointer ${
                      statusStyles[selectedInquiry.status]
                    }`}
                  >
                    {STATUSES.filter((s): s is WorkshopInquiryStatus => s !== 'All').map((st) => (
                      <option key={st} value={st} className="bg-popover text-popover-foreground">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <Button variant="outline" size="sm" onClick={() => setSelectedInquiry(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
