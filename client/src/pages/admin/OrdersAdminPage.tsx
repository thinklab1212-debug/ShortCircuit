import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Eye } from 'lucide-react'
import { orderApi } from '@/services'
import { AdminPageHeader, TablePagination } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ErrorFallback } from '@/components/ui/error'
import { formatDate, getUserName } from '@/utils'
import { ORDER_STATUS_LABELS } from '@/constants'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus, PaymentStatus, User } from '@/types'

// ─── Orders Admin List ──────────────────────────────────────────────────────────

const LIMIT = 10

const STATUS_TABS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Placed', value: 'placed' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Returned', value: 'returned' },
]

function customerName(user: Order['user']): string {
  if (!user) return 'Guest'
  if (typeof user === 'string') return user
  return getUserName(user as User) || (user as User).email || 'Customer'
}

const paymentVariant: Record<PaymentStatus, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  paid: 'success',
  pending: 'warning',
  failed: 'destructive',
  refunded: 'secondary',
}

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  placed: 'info',
  confirmed: 'info',
  processing: 'warning',
  shipped: 'info',
  out_for_delivery: 'warning',
  delivered: 'success',
  cancelled: 'destructive',
  returned: 'destructive',
}

export default function OrdersAdminPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<OrderStatus | ''>('')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'orders', { page, status }],
    queryFn: () =>
      orderApi
        .getAll({ page, limit: LIMIT, orderStatus: status || undefined })
        .then((res) => res.data),
  })

  const orders = data?.data ?? []
  const pagination = data?.pagination

  if (isError) {
    return <ErrorFallback error={error as Error} resetErrorBoundary={() => void refetch()} />
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Orders" description="View and manage customer orders" />

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || 'all'}
            onClick={() => {
              setStatus(tab.value)
              setPage(1)
            }}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              status === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-background text-muted-foreground hover:bg-accent'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: LIMIT }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const itemCount = order.items.reduce((sum, it) => sum + it.quantity, 0)
                  return (
                    <tr key={order._id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {order.orderId}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {customerName(order.user)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{itemCount}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(order.totalPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={paymentVariant[order.paymentStatus]} size="sm">
                          {order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge
                          variant={statusVariant[order.orderStatus] ?? 'secondary'}
                          size="sm"
                          dot
                        >
                          {ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="ghost" size="sm" leftIcon={<Eye />}>
                          <Link to={`/admin/orders/${order._id}`}>View</Link>
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
    </div>
  )
}
