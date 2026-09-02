import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router'
import toast from 'react-hot-toast'
import { ArrowLeft, MapPin, Package, Truck, User as UserIcon, Download, Trash2, XCircle, AlertTriangle } from 'lucide-react'
import { orderApi } from '@/services'
import { AdminPageHeader, AdminSection } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { FormField } from '@/components/ui/form-field'
import { Loader } from '@/components/ui/loader'
import { ErrorFallback } from '@/components/ui/error'
import { formatPrice, formatDateTime, getUserName, formatStatusLabel } from '@/utils'
import type { OrderStatus, User } from '@/types'

// ─── Order Detail (Admin) ───────────────────────────────────────────────────────

const STATUS_OPTIONS: OrderStatus[] = [
  'pending_payment',
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
]

export default function OrderDetailAdminPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()

  const { data: order, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => orderApi.getAdminById(id).then((res) => res.data.data),
    enabled: Boolean(id),
  })

  const [statusValue, setStatusValue] = useState<OrderStatus>('placed')
  const [note, setNote] = useState('')
  const [carrier, setCarrier] = useState('')
  const [trackingId, setTrackingId] = useState('')
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  const handleInvoice = async () => {
    if (!order) return
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
      toast.error('Failed to download invoice. Check if order status is delivered and paid.')
    } finally {
      setInvoiceLoading(false)
    }
  }

  useEffect(() => {
    if (order) {
      setStatusValue(order.orderStatus)
      setCarrier(order.shippingCarrier ?? '')
      setTrackingId(order.shippingTrackingId ?? '')
    }
  }, [order])

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('Cancelled by store administrator — wrong / fraudulent order')

  const statusMutation = useMutation({
    mutationFn: () =>
      orderApi.updateStatus(id, { status: statusValue, note: note || undefined }),
    onSuccess: () => {
      toast.success('Order status updated')
      setNote('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update status'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => orderApi.cancel(id, cancelReason.trim() || 'Cancelled by store administrator'),
    onSuccess: () => {
      toast.success('Order cancelled and stock restored to inventory')
      setCancelModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || err?.message || 'Failed to cancel order'),
  })

  const trackingMutation = useMutation({
    mutationFn: () =>
      orderApi.updateTracking(id, {
        shippingCarrier: carrier.trim(),
        shippingTrackingId: trackingId.trim(),
      }),
    onSuccess: () => {
      toast.success('Tracking updated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] })
    },
    onError: () => toast.error('Failed to update tracking'),
  })

  const deleteHistoryMutation = useMutation({
    mutationFn: (index: number) => orderApi.deleteStatusHistory(id, index),
    onSuccess: () => {
      toast.success('Timeline entry removed')
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] })
    },
    onError: () => toast.error('Failed to remove timeline entry'),
  })

  if (isLoading) return <Loader fullScreen text="Loading order..." />
  if (isError) {
    return <ErrorFallback error={error as Error} resetErrorBoundary={() => void refetch()} />
  }
  if (!order) return null

  const customer = typeof order.user === 'string' ? null : (order.user as User)
  const addr = order.shippingAddress

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title={`Order ${order.orderId}`}
        description={`Placed on ${formatDateTime(order.createdAt)}`}
        action={
          <div className="flex gap-2">
            {['pending_payment', 'placed', 'confirmed', 'processing'].includes(order.orderStatus) && (
              <Button
                variant="destructive"
                onClick={() => setCancelModalOpen(true)}
                leftIcon={<XCircle className="h-4 w-4" />}
              >
                Cancel Order
              </Button>
            )}
            {(order.invoiceNumber || (order.orderStatus === 'delivered' && order.paymentStatus === 'paid')) && (
              <Button
                variant="outline"
                loading={invoiceLoading}
                onClick={handleInvoice}
                leftIcon={<Download />}
              >
                Download Invoice
              </Button>
            )}
            <Button asChild variant="outline" leftIcon={<ArrowLeft />}>
              <Link to="/admin/orders">Back to orders</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: items + timeline */}
        <div className="space-y-6 lg:col-span-2">
          <AdminSection title="Items">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <ul className="divide-y divide-border">
                {order.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-4 p-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.variant
                          ? `${item.variant.name === 'Variant' ? item.variant.value : `${item.variant.name}: ${item.variant.value}`} · `
                          : ''}
                        Qty {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
              {/* Totals */}
              <div className="space-y-2 border-t border-border bg-muted/20 p-4 text-sm">
                <Row label="Items" value={formatPrice(order.itemsPrice)} />
                <Row label="Shipping" value={formatPrice(order.shippingPrice)} />
                <Row label="Tax" value={formatPrice(order.taxPrice)} />
                {order.discountAmount > 0 && (
                  <Row
                    label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`}
                    value={`- ${formatPrice(order.discountAmount)}`}
                  />
                )}
                <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatPrice(order.totalPrice)}</span>
                </div>
              </div>
            </div>
          </AdminSection>

          <AdminSection title="Timeline">
            <div className="rounded-2xl border border-border bg-card p-6">
              {order.statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No history yet.</p>
              ) : (
                <ol className="space-y-4">
                  {order.statusHistory.map((entry, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 group">
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                          {i < order.statusHistory.length - 1 && (
                            <span className="mt-1 w-px flex-1 bg-border" />
                          )}
                        </div>
                        <div className="pb-1">
                          <p className="text-sm font-medium text-foreground">
                            {formatStatusLabel(entry.status)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(entry.timestamp)}
                          </p>
                          {entry.note && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{entry.note}</p>
                          )}
                        </div>
                      </div>
                      {order.statusHistory.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this timeline entry?')) {
                              deleteHistoryMutation.mutate(i)
                            }
                          }}
                          title="Delete this timeline entry"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </AdminSection>
        </div>

        {/* Right: actions + info */}
        <div className="space-y-6">
          {/* Status summary */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order status</span>
              <Badge variant="info" size="sm" dot>
                {formatStatusLabel(order.orderStatus)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment</span>
              <Badge
                variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                size="sm"
              >
                {formatStatusLabel(order.paymentStatus)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Method</span>
              <span className="text-sm font-medium uppercase text-foreground">
                {order.paymentMethod}
              </span>
            </div>
          </div>

          {/* Customer */}
          <AdminSection title="Customer">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-2 text-sm">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                {customer ? getUserName(customer) || customer.email : 'Guest'}
              </p>
              {customer?.email && (
                <p className="text-muted-foreground">{customer.email}</p>
              )}
              {customer?.phone && (
                <p className="text-muted-foreground">{customer.phone}</p>
              )}
            </div>
          </AdminSection>

          {/* Shipping address */}
          <AdminSection title="Shipping Address">
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              <p className="mb-1 flex items-center gap-2 font-medium text-foreground">
                <MapPin className="h-4 w-4" />
                {addr.fullName}
              </p>
              <p>{addr.addressLine1}</p>
              {addr.addressLine2 && <p>{addr.addressLine2}</p>}
              {addr.landmark && <p>{addr.landmark}</p>}
              <p>
                {addr.city}, {addr.state} {addr.pincode}
              </p>
              <p>{addr.country}</p>
              <p className="mt-1">{addr.phone}</p>
            </div>
          </AdminSection>

          {/* Update status */}
          <AdminSection title="Update Status">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <FormField label="Status">
                <Select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value as OrderStatus)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {formatStatusLabel(s)}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Note (optional)">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Add an internal note"
                />
              </FormField>
              <Button
                className="w-full"
                leftIcon={<Package />}
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate()}
              >
                Update Status
              </Button>
            </div>
          </AdminSection>

          {/* Tracking */}
          <AdminSection title="Tracking">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              <FormField label="Carrier">
                <Input
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g. Delhivery"
                />
              </FormField>
              <FormField label="Tracking ID">
                <Input
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="e.g. 1234567890"
                />
              </FormField>
              <Button
                variant="outline"
                className="w-full"
                leftIcon={<Truck />}
                loading={trackingMutation.isPending}
                disabled={!carrier.trim() || !trackingId.trim()}
                onClick={() => trackingMutation.mutate()}
              >
                Update Tracking
              </Button>
            </div>
          </AdminSection>
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3 text-destructive mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Cancel Order</h3>
                <p className="text-xs text-muted-foreground">Order ID: {order.orderId}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Cancelling this order will immediately mark it as cancelled and{' '}
              <strong className="text-foreground">restore all product item stock back to inventory</strong>.
            </p>

            <FormField label="Cancellation Reason" className="mb-4">
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancelling this order..."
                rows={3}
              />
            </FormField>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={cancelMutation.isPending}
                onClick={() => setCancelModalOpen(false)}
              >
                Keep Order
              </Button>
              <Button
                variant="destructive"
                loading={cancelMutation.isPending}
                disabled={cancelMutation.isPending || !cancelReason.trim()}
                onClick={() => cancelMutation.mutate()}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
