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
import { useOrder, useCancelOrder } from '@/hooks'
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

// ─── Cancel Modal ─────────────────────────────────────────────────────────────

function CancelModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  loading: boolean
}) {
  const [reason, setReason] = useState('')
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-foreground">Cancel Order</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Please tell us why you are cancelling this order.
        </p>
        <Textarea
          className="mt-4"
          rows={3}
          placeholder="Reason for cancellation..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Keep Order
          </Button>
          <Button
            variant="destructive"
            loading={loading}
            loadingText="Cancelling..."
            disabled={reason.trim().length === 0}
            onClick={() => onConfirm(reason.trim())}
          >
            Cancel Order
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

// ─── Order Detail Page ────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, isError } = useOrder(id || '')
  const cancelOrder = useCancelOrder()
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

  const canCancel = order.orderStatus === 'placed' || order.orderStatus === 'confirmed'
  const addr = order.shippingAddress

  const handleCancel = (reason: string) => {
    cancelOrder.mutate(
      { id: order._id, reason },
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
                {canCancel && (
                  <Button
                    variant="soft-destructive"
                    size="sm"
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel Order
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
            <CardContent>
              <StatusTimeline currentStatus={order.orderStatus} history={order.statusHistory} />
              {order.cancellationReason && (
                <div className="mt-4 rounded-lg bg-error-50 p-3 text-sm text-error-700 dark:bg-error-950/50 dark:text-error-300">
                  Reason: {order.cancellationReason}
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

      <CancelModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        loading={cancelOrder.isPending}
      />
    </div>
  )
}
