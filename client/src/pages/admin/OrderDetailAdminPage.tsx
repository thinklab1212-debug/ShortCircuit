import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router'
import toast from 'react-hot-toast'
import { ArrowLeft, MapPin, Package, Truck, User as UserIcon } from 'lucide-react'
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
import { formatPrice, formatDateTime, getUserName } from '@/utils'
import { ORDER_STATUS_LABELS } from '@/constants'
import type { OrderStatus, User } from '@/types'

// ─── Order Detail (Admin) ───────────────────────────────────────────────────────

const STATUS_OPTIONS: OrderStatus[] = [
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

  useEffect(() => {
    if (order) {
      setStatusValue(order.orderStatus)
      setCarrier(order.shippingCarrier ?? '')
      setTrackingId(order.shippingTrackingId ?? '')
    }
  }, [order])

  const statusMutation = useMutation({
    mutationFn: () =>
      orderApi.updateStatus(id, { status: statusValue, note: note || undefined }),
    onSuccess: () => {
      toast.success('Order status updated')
      setNote('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] })
    },
    onError: () => toast.error('Failed to update status'),
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
          <Button asChild variant="outline" leftIcon={<ArrowLeft />}>
            <Link to="/admin/orders">Back to orders</Link>
          </Button>
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
                        {item.variant ? `${item.variant.name}: ${item.variant.value} · ` : ''}
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
                    <li key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                        {i < order.statusHistory.length - 1 && (
                          <span className="mt-1 w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="pb-1">
                        <p className="text-sm font-medium text-foreground">
                          {ORDER_STATUS_LABELS[entry.status] ?? entry.status}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(entry.timestamp)}
                        </p>
                        {entry.note && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{entry.note}</p>
                        )}
                      </div>
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
                {ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment</span>
              <Badge
                variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                size="sm"
              >
                {order.paymentStatus}
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
                      {ORDER_STATUS_LABELS[s] ?? s}
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
