import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Eye, Edit2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { orderApi } from '@/services'
import { AdminPageHeader, TablePagination } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ErrorFallback } from '@/components/ui/error'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatDateTime, getUserName } from '@/utils'
import { ORDER_STATUS_LABELS } from '@/constants'
import { cn } from '@/lib/utils'
import type { Order, User } from '@/types'
import toast from 'react-hot-toast'

const LIMIT = 10

const REQUEST_STATUS_TABS = [
  { label: 'All Requests', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

function customerName(user: Order['user']): string {
  if (!user) return 'Guest'
  if (typeof user === 'string') return user
  return getUserName(user as User) || (user as User).email || 'Customer'
}

const formatCategory = (category?: string) => {
  if (!category) return '-'
  const labels: Record<string, string> = {
    ordered_by_mistake: 'Ordered by mistake',
    found_better_price: 'Found better price',
    delivery_delay: 'Delivery delay',
    address_issue: 'Address issue',
    financial_reason: 'Financial reason',
    duplicate_order: 'Duplicate order',
    other: 'Other',
  }
  return labels[category] || category
}

const requestStatusVariant: Record<string, 'warning' | 'success' | 'destructive' | 'secondary'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
}

interface ReviewModalProps {
  order: Order | null
  onClose: () => void
  refetch: () => void
}

function ReviewRequestModal({ order, onClose, refetch }: ReviewModalProps) {
  const queryClient = useQueryClient()
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [adminResponse, setAdminResponse] = useState('')
  const [internalAdminNote, setInternalAdminNote] = useState('')
  const [refundConfirmed, setRefundConfirmed] = useState(false)

  const reviewMutation = useMutation({
    mutationFn: (data: {
      action: 'approve' | 'reject'
      adminResponse?: string
      internalAdminNote?: string
    }) => {
      if (!order) throw new Error('No active order')
      return orderApi.reviewCancellationRequest(order._id, data).then((res) => res.data.data)
    },
    onSuccess: (updatedOrder) => {
      toast.success(`Cancellation request ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
      queryClient.invalidateQueries({ queryKey: ['admin', 'cancellation-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'cancellation-requests', 'pending-count'] })
      queryClient.setQueryData(['admin', 'orders', 'detail', updatedOrder._id], updatedOrder)
      refetch()
      onClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Could not process review'
      toast.error(msg)
    },
  })

  if (!order || !order.cancellationRequest) return null

  const req = order.cancellationRequest
  const isPending = order.cancellationRequest.status === 'pending'
  const isApprove = action === 'approve'
  const canSubmit = !isPending || !isApprove || refundConfirmed

  const handleSubmit = () => {
    reviewMutation.mutate({
      action,
      adminResponse: adminResponse.trim() || undefined,
      internalAdminNote: internalAdminNote.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Review Cancellation Request</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Order ID: {order.orderId}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        {/* Request details */}
        <div className="rounded-lg bg-muted/50 border border-border p-4 mb-4 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground font-semibold">Customer:</span>
            <span className="text-foreground">{customerName(order.user)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-semibold">Date Submitted:</span>
            <span className="text-foreground">{req.requestedAt ? formatDateTime(req.requestedAt) : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-semibold">Category:</span>
            <span className="text-foreground font-medium">{formatCategory(req.category)}</span>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold mb-0.5">Reason / Explanation:</p>
            <p className="text-foreground bg-background border border-border rounded p-2 mt-1 select-text">
              {req.reason}
            </p>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-border">
            <span className="text-muted-foreground font-semibold">Current Order Status:</span>
            <span className="capitalize font-semibold text-foreground">{ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}</span>
          </div>
        </div>

        {isPending ? (
          <div className="space-y-4">
            {/* Action Selection */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Action Decision
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAction('approve')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-semibold transition-all',
                    action === 'approve'
                      ? 'border-success-500 bg-success-50/20 text-success-600 dark:bg-success-950/10'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  <CheckCircle className="h-4 w-4" /> Approve Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setAction('reject')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-semibold transition-all',
                    action === 'reject'
                      ? 'border-error-500 bg-error-50/20 text-error-600 dark:bg-error-950/10'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  <XCircle className="h-4 w-4" /> Reject Cancel
                </button>
              </div>
            </div>

            {/* Warning Box for Approval */}
            {isApprove && (
              <div className="rounded-lg border border-warning-200 bg-warning-50/50 p-4 text-xs text-warning-800 dark:border-warning-950/30 dark:bg-warning-950/10 dark:text-warning-300">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-warning-600 dark:text-warning-400" />
                  <div>
                    <h5 className="font-bold">Refund Safety Notification</h5>
                    <p className="mt-1 leading-normal">
                      Approving cancellation does <strong>NOT</strong> process refunds automatically. Refunds must be handled separately inside your payment gateway dashboard (e.g. Razorpay).
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-warning-200 dark:border-warning-900 pt-2">
                  <input
                    type="checkbox"
                    id="refund-check"
                    checked={refundConfirmed}
                    onChange={(e) => setRefundConfirmed(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="refund-check" className="font-semibold cursor-pointer select-none">
                    I understand refunds are handled separately.
                  </label>
                </div>
              </div>
            )}

            {/* Note fields */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Response to Customer (Visible on Timeline)
              </label>
              <Textarea
                rows={3}
                placeholder="Optional customer-facing notes..."
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Internal Admin Note (Admin Only - Hidden from Customer)
              </label>
              <Textarea
                rows={2}
                placeholder="e.g. Repeated cancellations. Potential fraud check."
                value={internalAdminNote}
                onChange={(e) => setInternalAdminNote(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="ghost" onClick={onClose} disabled={reviewMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant={isApprove ? 'success' : 'destructive'}
                disabled={!canSubmit}
                loading={reviewMutation.isPending}
                onClick={handleSubmit}
              >
                Confirm Decision
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded bg-muted p-3 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Review Status:</span>
                <Badge variant={requestStatusVariant[req.status]}>{req.status}</Badge>
              </div>
              {req.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-semibold">Reviewed At:</span>
                  <span className="text-foreground">{formatDateTime(req.reviewedAt)}</span>
                </div>
              )}
              {req.adminResponse && (
                <div>
                  <p className="text-muted-foreground font-semibold">Customer Response:</p>
                  <p className="italic text-foreground mt-1 bg-background p-2 border border-border rounded">
                    "{req.adminResponse}"
                  </p>
                </div>
              )}
              {req.internalAdminNote && (
                <div>
                  <p className="text-muted-foreground font-semibold text-error-600 dark:text-error-400">Internal Admin Note (Admin-Only):</p>
                  <p className="text-foreground mt-1 bg-red-50/20 dark:bg-red-950/10 p-2 border border-red-200/50 rounded">
                    {req.internalAdminNote}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CancellationRequestsAdminPage() {
  const [page, setPage] = useState(1)
  const [requestStatus, setRequestStatus] = useState<string>('')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'cancellation-requests', { page, requestStatus, search }],
    queryFn: () =>
      orderApi
        .getCancellationRequests({
          page,
          limit: LIMIT,
          requestStatus: requestStatus || undefined,
          search: search || undefined,
        })
        .then((res) => res.data),
  })

  const orders = data?.data ?? []
  const pagination = data?.pagination

  if (isError) {
    return <ErrorFallback error={error as Error} resetErrorBoundary={() => void refetch()} />
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Cancellation Requests"
        description="Review and manage customer order cancellation requests"
      />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {REQUEST_STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setRequestStatus(tab.value)
                setPage(1)
              }}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                requestStatus === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-background text-muted-foreground hover:bg-accent'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Search Order ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-md border border-border bg-background px-3.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Requested Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: LIMIT }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No cancellation requests found
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const req = order.cancellationRequest!
                  return (
                    <tr key={order._id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        <Link to={`/admin/orders/${order._id}`} className="hover:text-primary underline">
                          {order.orderId}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {customerName(order.user)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {req.requestedAt ? formatDate(req.requestedAt) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">
                        {formatCategory(req.category)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                        {req.reason}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={requestStatusVariant[req.status] ?? 'secondary'} size="sm">
                          {req.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={req.status === 'pending' ? <Edit2 /> : <Eye />}
                          onClick={() => setSelectedOrder(order)}
                        >
                          {req.status === 'pending' ? 'Review' : 'View'}
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <TablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.totalResults}
            limit={pagination.limit}
            onPageChange={setPage}
            className="border-t border-border"
          />
        )}
      </div>

      <ReviewRequestModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        refetch={refetch}
      />
    </div>
  )
}
