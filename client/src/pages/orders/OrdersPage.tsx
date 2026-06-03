import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { PackageSearch, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/error'
import { useMyOrders } from '@/hooks'
import { formatPrice, formatDate, pluralize } from '@/utils'
import { ORDER_STATUS_LABELS } from '@/constants'
import type { Order, OrderStatus } from '@/types'
import { staggerContainer, fadeInUp } from '@/config/animations'

// ─── Status Badge ─────────────────────────────────────────────────────────────

type BadgeVariant = 'success' | 'destructive' | 'info' | 'warning'

function statusVariant(status: OrderStatus): BadgeVariant {
  if (status === 'delivered') return 'success'
  if (status === 'cancelled' || status === 'returned') return 'destructive'
  if (status === 'shipped' || status === 'out_for_delivery') return 'info'
  return 'warning'
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={statusVariant(status)} dot>
      {ORDER_STATUS_LABELS[status] || status}
    </Badge>
  )
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0)
  const thumbs = order.items.slice(0, 4)
  const extra = order.items.length - thumbs.length

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">#{order.orderId}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.orderStatus} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        {thumbs.map((item, i) => (
          <div
            key={`${item.product}-${i}`}
            className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
          >
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
        {extra > 0 && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-xs font-medium text-muted-foreground">
            +{extra}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="text-sm text-muted-foreground">
          {itemCount} {pluralize(itemCount, 'item')} ·{' '}
          <span className="font-semibold text-foreground">{formatPrice(order.totalPrice)}</span>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to={`/orders/${order._id}`}>View Details</Link>
        </Button>
      </div>
    </Card>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OrderCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 skeleton rounded" />
          <div className="h-3 w-24 skeleton rounded" />
        </div>
        <div className="h-6 w-24 skeleton rounded-full" />
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 w-14 skeleton rounded-lg" />
        ))}
      </div>
      <div className="h-9 w-full skeleton rounded" />
    </div>
  )
}

// ─── Orders Page ──────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useMyOrders(page, 10)

  const orders = data?.data ?? []
  const pagination = data?.pagination

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-display-xs sm:text-display-sm font-heading text-foreground">My Orders</h1>
        <p className="mt-1 text-body-md text-muted-foreground">
          Track, manage and review your purchases
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <EmptyState
          icon={<PackageSearch className="h-8 w-8 text-error-500" />}
          title="Unable to load orders"
          description="Something went wrong while fetching your orders. Please try again."
          action={
            <Button variant="outline" onClick={() => setPage((p) => p)}>
              Retry
            </Button>
          }
        />
      )}

      {/* Empty */}
      {!isLoading && !isError && orders.length === 0 && (
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8 text-muted-foreground" />}
          title="No orders yet"
          description="When you place your first order, it will show up here."
          action={
            <Button asChild>
              <Link to="/shop">Start Shopping</Link>
            </Button>
          }
        />
      )}

      {/* List */}
      {!isLoading && !isError && orders.length > 0 && (
        <>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            {orders.map((order) => (
              <motion.div key={order._id} variants={fadeInUp}>
                <OrderCard order={order} />
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <span className="px-3 text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
