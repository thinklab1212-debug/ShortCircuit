import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PackageSearch,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Boxes,
  Package,
  CheckCircle2,
  Circle,
  XCircle,
  Truck,
  Mail,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/error'
import { useMyOrders } from '@/hooks'
import { bulkOrderApi } from '@/services'
import { formatPrice, formatDate, formatDateTime, pluralize, formatStatusLabel } from '@/utils'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus, BulkOrderQuote, BulkOrderStatus } from '@/types'
import { staggerContainer, fadeInUp } from '@/config/animations'

// ─── Regular Order Status Badge ───────────────────────────────────────────────

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
      {formatStatusLabel(status)}
    </Badge>
  )
}

// ─── Bulk Order Status Helpers ────────────────────────────────────────────────

const BULK_PROGRESSION: BulkOrderStatus[] = [
  'New',
  'In Review',
  'Quotation Sent',
  'Order Accepted',
  'Shipped',
  'Out for Delivery',
  'Delivered',
]

function normalizeBulkStatus(status: BulkOrderStatus): BulkOrderStatus {
  if (status === 'Under Review') return 'In Review'
  if (status === 'Quote Sent') return 'Quotation Sent'
  if (status === 'Completed') return 'Delivered'
  return status
}

function bulkStatusVariant(status: BulkOrderStatus): BadgeVariant {
  const norm = normalizeBulkStatus(status)
  if (norm === 'Delivered') return 'success'
  if (norm === 'Cancelled') return 'destructive'
  if (norm === 'Shipped' || norm === 'Out for Delivery') return 'info'
  if (norm === 'Quotation Sent' || norm === 'Order Accepted') return 'info'
  return 'warning'
}

function formatBulkStatusLabel(status: BulkOrderStatus): string {
  const norm = normalizeBulkStatus(status)
  if (norm === 'New') return 'Inquiry Received'
  return norm
}

// ─── Bulk Order Card ──────────────────────────────────────────────────────────

function BulkOrderCard({ quote }: { quote: BulkOrderQuote }) {
  const [expanded, setExpanded] = useState(false)
  const normalizedCurrent = normalizeBulkStatus(quote.status)
  const isCancelled = quote.status === 'Cancelled'
  const currentIndex = isCancelled ? -1 : BULK_PROGRESSION.indexOf(normalizedCurrent)

  const totalItemsCount = quote.items.reduce((sum, it) => sum + it.quantity, 0)

  return (
    <Card className="p-5 sm:p-6 transition-all border border-border hover:border-primary/30 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-base text-foreground">
              #{quote.quoteNumber}
            </span>
            <Badge variant="outline" className="text-[11px] font-semibold bg-primary/5 text-primary border-primary/20">
              Bulk RFQ
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Submitted on {formatDate(quote.createdAt)}
            {quote.customer.organization && ` · ${quote.customer.organization}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={bulkStatusVariant(quote.status)} dot>
            {formatBulkStatusLabel(quote.status)}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="text-xs h-8 px-2.5"
          >
            {expanded ? (
              <>
                Less <ChevronUp className="h-3.5 w-3.5 ml-1" />
              </>
            ) : (
              <>
                Track Details <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Mandatory Billing Notice Banner */}
      <div className="mt-4 rounded-xl border border-blue-500/25 bg-blue-500/5 p-3.5 text-xs text-foreground flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            Official Billing Notice:
          </span>{' '}
          Final billing and official tax invoice will be sent manually via email to{' '}
          <span className="font-medium underline decoration-blue-400/40">{quote.customer.email}</span>{' '}
          once your quotation is confirmed and processed.
        </div>
      </div>

      {/* Summary Overview */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-muted/40 border border-border/80 text-xs">
        <div>
          <span className="text-muted-foreground block text-[11px]">Requested Hardware</span>
          <span className="font-semibold text-foreground">
            {quote.items.length} unique parts ({totalItemsCount} units total)
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">Wholesale Quotation</span>
          <span className="font-bold text-sm text-foreground">
            {quote.quotedAmount ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                {formatPrice(quote.quotedAmount)}
              </span>
            ) : (
              <span className="text-muted-foreground italic font-normal text-xs">
                Under calculation
              </span>
            )}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">Contact Account</span>
          <span className="text-foreground truncate block">{quote.customer.phone}</span>
        </div>
      </div>

      {/* Expandable Tracking & Progression Timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-6 pt-6 border-t border-border space-y-6 overflow-hidden"
          >
            {/* Visual Lifecycle Timeline */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-primary" /> Live Quotation & Delivery Progression
              </h4>

              {isCancelled ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3 text-destructive">
                  <XCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">This bulk quotation has been cancelled.</p>
                    {quote.adminNotes && (
                      <p className="text-xs text-muted-foreground mt-0.5">{quote.adminNotes}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    {BULK_PROGRESSION.map((step, idx) => {
                      const reached = idx <= currentIndex
                      const isCurrent = idx === currentIndex
                      const matchingHistory = quote.statusHistory?.filter(
                        (h) => normalizeBulkStatus(h.status) === step
                      )
                      const timestamp = matchingHistory?.[matchingHistory.length - 1]?.timestamp

                      return (
                        <li
                          key={step}
                          className={cn(
                            'rounded-xl border p-3 flex flex-col justify-between text-left transition-all',
                            reached
                              ? isCurrent
                                ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                                : 'border-emerald-500/30 bg-emerald-500/5'
                              : 'border-border/60 bg-muted/20 opacity-60'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">
                              0{idx + 1}
                            </span>
                            {reached ? (
                              <CheckCircle2
                                className={cn(
                                  'h-4 w-4',
                                  isCurrent ? 'text-primary animate-pulse' : 'text-emerald-500'
                                )}
                              />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/30" />
                            )}
                          </div>
                          <div>
                            <p
                              className={cn(
                                'text-xs font-semibold leading-tight',
                                reached ? 'text-foreground' : 'text-muted-foreground'
                              )}
                            >
                              {step === 'New' ? 'Received' : step}
                            </p>
                            {timestamp ? (
                              <span className="text-[10px] text-muted-foreground block mt-1">
                                {formatDateTime(timestamp)}
                              </span>
                            ) : reached ? (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1">
                                Completed
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/50 block mt-1">
                                Pending
                              </span>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )}
            </div>

            {/* Admin Quotation Notes */}
            {quote.adminNotes && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Short Circuit Sales Team Remarks:
                </span>
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {quote.adminNotes}
                </p>
              </div>
            )}

            {/* Requested Products Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Itemized Component Specifications
              </h4>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3 text-left">Component / Part Description</th>
                      <th className="py-2.5 px-3 text-center w-20">Quantity</th>
                      <th className="py-2.5 px-3 text-right w-28">Target Price</th>
                      <th className="py-2.5 px-3 text-left">Item Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {quote.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {it.productName}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono text-primary">
                          {it.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          {it.targetPrice ? `₹${it.targetPrice}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                          {it.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Support / Direct Email Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-muted-foreground">
                Need updates or purchase order revision? Contact our corporate desk directly:
              </div>
              <Button asChild size="sm" variant="outline" className="text-xs h-8">
                <a
                  href={`mailto:sales.shortcircuit@gmail.com?subject=Inquiry regarding Bulk Order ${encodeURIComponent(
                    quote.quoteNumber
                  )}`}
                >
                  <Mail className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  sales.shortcircuit@gmail.com
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// ─── Standard Order Card ──────────────────────────────────────────────────────

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
  const [activeTab, setActiveTab] = useState<'store' | 'bulk'>('store')
  const [page, setPage] = useState(1)

  // Standard orders query
  const { data, isLoading, isError } = useMyOrders(page, 10)
  const orders = data?.data ?? []
  const pagination = data?.pagination

  // Bulk orders query
  const {
    data: bulkData,
    isLoading: isBulkLoading,
    isError: isBulkError,
    refetch: refetchBulk,
  } = useQuery({
    queryKey: ['my-bulk-orders'],
    queryFn: async () => {
      const res = await bulkOrderApi.getMyBulkOrders()
      return res.data?.data ?? []
    },
  })

  const bulkOrders = bulkData ?? []

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-display-xs sm:text-display-sm font-heading text-foreground">
          My Orders & Quotations
        </h1>
        <p className="mt-1 text-body-md text-muted-foreground">
          Track, manage and review your purchases and wholesale RFQ inquiries
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all',
            activeTab === 'store'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Package className="h-4 w-4" />
          Store Orders
          {orders.length > 0 && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs',
                activeTab === 'store'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {pagination?.totalResults ?? orders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bulk')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all',
            activeTab === 'bulk'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Boxes className="h-4 w-4" />
          Bulk Orders (RFQ)
          {bulkOrders.length > 0 && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs',
                activeTab === 'bulk'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {bulkOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── TAB 1: Store Orders ─── */}
      {activeTab === 'store' && (
        <>
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
              title="No store orders yet"
              description="When you place your first store order, it will show up here."
              action={
                <Button asChild>
                  <Link to="/shop">Start Shopping</Link>
                </Button>
              }
            />
          )}

          {/* Orders List */}
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
        </>
      )}

      {/* ─── TAB 2: Bulk Orders ─── */}
      {activeTab === 'bulk' && (
        <>
          {/* Loading */}
          {isBulkLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {isBulkError && !isBulkLoading && (
            <EmptyState
              icon={<PackageSearch className="h-8 w-8 text-error-500" />}
              title="Unable to load bulk orders"
              description="Something went wrong while fetching your bulk quotations. Please try again."
              action={
                <Button variant="outline" onClick={() => refetchBulk()}>
                  Retry
                </Button>
              }
            />
          )}

          {/* Empty */}
          {!isBulkLoading && !isBulkError && bulkOrders.length === 0 && (
            <EmptyState
              icon={<Boxes className="h-8 w-8 text-muted-foreground" />}
              title="No bulk quotation requests yet"
              description="Purchasing for a college lab, club, or industrial project? Request wholesale component quotes with GST billing."
              action={
                <Button asChild>
                  <Link to="/shop">Explore Shop & Request Quote</Link>
                </Button>
              }
            />
          )}

          {/* Bulk Orders List */}
          {!isBulkLoading && !isBulkError && bulkOrders.length > 0 && (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-4"
            >
              {bulkOrders.map((quote) => (
                <motion.div key={quote._id} variants={fadeInUp}>
                  <BulkOrderCard quote={quote} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
