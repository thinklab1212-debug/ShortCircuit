import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  PackageX,
  CheckCircle2,
  Circle,
  XCircle,
  Truck,
  Download,
  MapPin,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Loader } from '@/components/ui/loader'
import { useOrder, useRequestCancellation } from '@/hooks'
import { orderApi } from '@/services'
import { formatPrice, formatDate, formatDateTime, capitalize } from '@/utils'
import { ORDER_STATUS_LABELS } from '@/constants'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'
import { fadeInUp } from '@/config/animations'
import { OrderStatusBadge } from './OrdersPage'

// ─── Standard progression ─────────────────────────────────────────────────────

const PROGRESSION: OrderStatus[] = [
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
]

// ─── Request Cancellation Modal ──────────────────────────────────────────────

function RequestCancellationModal({
  open,
  onClose,
  onConfirm,
  loading,
  orderStatus,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (category: string, reason: string) => void
  loading: boolean
  orderStatus: string
}) {
  const [category, setCategory] = useState('')
  const [reason, setReason] = useState('')

  if (!open) return null

  const isValid = category !== '' && reason.trim().length >= 20 && reason.trim().length <= 500

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-foreground">Request Order Cancellation</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit a request to cancel your order. Admin review is required.
        </p>

        {orderStatus === 'shipped' && (
          <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50/50 p-3 text-xs text-yellow-800 dark:border-yellow-950/30 dark:bg-yellow-950/20 dark:text-yellow-300">
            <strong>⚠️ Shipped Status Warning:</strong> This order has already been shipped. Cancellation approval may not be possible once the package is in transit with the courier.
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Category
            </label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select cancellation reason category...</option>
              <option value="ordered_by_mistake">Ordered by mistake</option>
              <option value="found_better_price">Found better price</option>
              <option value="delivery_delay">Delivery delay</option>
              <option value="address_issue">Address issue</option>
              <option value="financial_reason">Financial reason</option>
              <option value="duplicate_order">Duplicate order</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Detailed Explanation ({reason.trim().length}/500)
            </label>
            <Textarea
              rows={4}
              placeholder="Please provide details (minimum 20 characters)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {reason.trim().length > 0 && reason.trim().length < 20 && (
              <p className="mt-1 text-xs text-error-500">
                Reason must be at least 20 characters long.
              </p>
            )}
            {reason.trim().length > 500 && (
              <p className="mt-1 text-xs text-error-500">
                Reason must not exceed 500 characters.
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Close
          </Button>
          <Button
            variant="destructive"
            loading={loading}
            loadingText="Submitting..."
            disabled={!isValid}
            onClick={() => onConfirm(category, reason.trim())}
          >
            Submit Request
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function StatusTimeline({
  currentStatus,
  history,
}: {
  currentStatus: OrderStatus
  history: { status: OrderStatus; timestamp: string; note?: string }[]
}) {
  if (currentStatus === 'cancelled' || currentStatus === 'returned') {
    return (
      <div className="space-y-4">
        {history.map((entry, i) => (
          <div key={i} className="flex gap-3">
            <div className="mt-0.5">
              {entry.status === 'cancelled' || entry.status === 'returned' ? (
                <XCircle className="h-5 w-5 text-error-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-success-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {ORDER_STATUS_LABELS[entry.status] || entry.status}
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(entry.timestamp)}</p>
              {entry.note && <p className="mt-0.5 text-xs text-muted-foreground">{entry.note}</p>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const currentIndex = PROGRESSION.indexOf(currentStatus)
  const timestampFor = (status: OrderStatus) =>
    history.find((h) => h.status === status)?.timestamp

  return (
    <ol className="relative">
      {PROGRESSION.map((status, i) => {
        const reached = i <= currentIndex
        const isCurrent = i === currentIndex
        const ts = timestampFor(status)
        const isLast = i === PROGRESSION.length - 1
        return (
          <li key={status} className="flex gap-3 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              {reached ? (
                <CheckCircle2
                  className={cn('h-5 w-5', isCurrent ? 'text-primary' : 'text-success-500')}
                />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40" />
              )}
              {!isLast && (
                <span
                  className={cn(
                    'mt-1 w-px flex-1',
                    i < currentIndex ? 'bg-success-500' : 'bg-border'
                  )}
                />
              )}
            </div>
            <div className="pb-2">
              <p
                className={cn(
                  'text-sm font-medium',
                  reached ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {ORDER_STATUS_LABELS[status] || status}
              </p>
              {ts && <p className="text-xs text-muted-foreground">{formatDateTime(ts)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const formatCategory = (category?: string) => {
  if (!category) return '';
  const labels: Record<string, string> = {
    ordered_by_mistake: 'Ordered by mistake',
    found_better_price: 'Found better price',
    delivery_delay: 'Delivery delay',
    address_issue: 'Address issue',
    financial_reason: 'Financial reason',
    duplicate_order: 'Duplicate order',
    other: 'Other',
  };
  return labels[category] || capitalize(category.replace(/_/g, ' '));
};

// ─── Order Detail Page ────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, isError } = useOrder(id || '')
  const requestCancellation = useRequestCancellation()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  if (isLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center py-16">
        <Loader size="lg" text="Loading order..." />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="container py-16">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-50 dark:bg-error-950/50">
            <PackageX className="h-8 w-8 text-error-500" />
          </div>
          <h1 className="mb-2 text-xl font-semibold text-foreground">Order Not Found</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            The order you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    )
  }

  const canRequestCancellation =
    order.orderStatus !== 'delivered' &&
    order.orderStatus !== 'cancelled' &&
    order.orderStatus !== 'returned' &&
    !order.cancellationRequest?.requested;

  const addr = order.shippingAddress

  const handleRequestCancellation = (category: string, reason: string) => {
    requestCancellation.mutate(
      { id: order._id, category, reason },
      { onSuccess: () => setCancelOpen(false) }
    )
  }

  const handleInvoice = async () => {
    setInvoiceLoading(true)
    try {
      const response = await orderApi.getInvoice(order._id)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Invoice-${order.orderId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Invoice downloaded successfully')
    } catch {
      toast.error('Could not download invoice. Confirm the order is paid and delivered.')
    } finally {
      setInvoiceLoading(false)
    }
  }

  return (
    <div className="container py-6 lg:py-8">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/orders">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </Link>
      </Button>

      {/* Header */}
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Order #{order.orderId}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Placed on {formatDate(order.createdAt)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Payment: {capitalize(order.paymentMethod)} ·{' '}
                <span className="capitalize">{order.paymentStatus}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <OrderStatusBadge status={order.orderStatus} />
              <div className="flex flex-col items-end gap-2">
                {order.orderStatus === 'delivered' && order.paymentStatus === 'paid' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInvoice}
                    loading={invoiceLoading}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Invoice
                  </Button>
                ) : (
                  <p className="max-w-xs text-right text-xs text-muted-foreground italic">
                    Invoice will be available after successful delivery and payment completion.
                  </p>
                )}
                {canRequestCancellation && (
                  <Button
                    variant="soft-destructive"
                    size="sm"
                    onClick={() => setCancelOpen(true)}
                  >
                    Request Cancellation
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, i) => (
                <div key={`${item.product}-${i}`} className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.slug}`}
                      className="text-sm font-medium text-foreground hover:text-primary line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground">
                        {item.variant.name}: {item.variant.value}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <StatusTimeline currentStatus={order.orderStatus} history={order.statusHistory} />
              
              {order.cancellationRequest?.requested && (
                <div className="mt-6 border-t border-border pt-6">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-error-600 dark:text-error-400 mb-4">
                    <XCircle className="h-4 w-4 animate-pulse" /> Cancellation Request Details
                  </h4>
                  <div className="relative border-l border-border pl-4 ml-2 space-y-4">
                    {/* Step 1: Requested */}
                    <div className="relative">
                      <span className="absolute -left-[21px] mt-1.5 flex h-2.5 w-2.5 rounded-full bg-primary" />
                      <p className="text-xs font-semibold text-foreground">Cancellation Requested</p>
                      {order.cancellationRequest.requestedAt && (
                        <p className="text-[10px] text-muted-foreground">
                          {formatDateTime(order.cancellationRequest.requestedAt)}
                        </p>
                      )}
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        <strong>Category:</strong> {formatCategory(order.cancellationRequest.category)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong>Reason:</strong> {order.cancellationRequest.reason}
                      </p>
                    </div>

                    {/* Step 2: Pending Review */}
                    {order.cancellationRequest.status === 'pending' && (
                      <div className="relative">
                        <span className="absolute -left-[21px] mt-1.5 flex h-2.5 w-2.5 rounded-full bg-yellow-500 animate-pulse" />
                        <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Admin Review Pending</p>
                        <p className="text-[10px] text-muted-foreground">Our support team is reviewing your request.</p>
                      </div>
                    )}

                    {/* Step 3: Approved / Rejected */}
                    {order.cancellationRequest.status !== 'pending' && (
                      <div className="relative">
                        <span
                          className={cn(
                            "absolute -left-[21px] mt-1.5 flex h-2.5 w-2.5 rounded-full",
                            order.cancellationRequest.status === 'approved' ? 'bg-success-500' : 'bg-error-500'
                          )}
                        />
                        <p
                          className={cn(
                            "text-xs font-semibold uppercase tracking-wider",
                            order.cancellationRequest.status === 'approved' ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
                          )}
                        >
                          Cancellation Request {capitalize(order.cancellationRequest.status)}
                        </p>
                        {order.cancellationRequest.reviewedAt && (
                          <p className="text-[10px] text-muted-foreground">
                            {formatDateTime(order.cancellationRequest.reviewedAt)}
                          </p>
                        )}
                        {order.cancellationRequest.adminResponse && (
                          <div className="mt-1.5 rounded bg-muted p-2 text-xs text-foreground italic border-l-2 border-border">
                            "{order.cancellationRequest.adminResponse}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Price breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Price Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items Total</span>
                <span className="text-foreground">{formatPrice(order.itemsPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-foreground">
                  {order.shippingPrice === 0 ? 'Free' : formatPrice(order.shippingPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground">{formatPrice(order.taxPrice)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-success-600">−{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">{formatPrice(order.totalPrice)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{addr.fullName}</p>
              <p>{addr.addressLine1}</p>
              {addr.addressLine2 && <p>{addr.addressLine2}</p>}
              {addr.landmark && <p>{addr.landmark}</p>}
              <p>
                {addr.city}, {addr.state} {addr.pincode}
              </p>
              <p>{addr.country}</p>
              <p className="mt-1">Phone: {addr.phone}</p>
            </CardContent>
          </Card>

          {/* Tracking */}
          {(order.shippingCarrier || order.shippingTrackingId) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {order.shippingCarrier && (
                  <p>
                    Carrier: <span className="text-foreground">{order.shippingCarrier}</span>
                  </p>
                )}
                {order.shippingTrackingId && (
                  <p>
                    Tracking ID:{' '}
                    <span className="font-medium text-foreground">{order.shippingTrackingId}</span>
                  </p>
                )}
                {order.estimatedDelivery && (
                  <p>
                    Est. Delivery:{' '}
                    <span className="text-foreground">{formatDate(order.estimatedDelivery)}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <RequestCancellationModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleRequestCancellation}
        loading={requestCancellation.isPending}
        orderStatus={order.orderStatus}
      />
    </div>
  )
}
