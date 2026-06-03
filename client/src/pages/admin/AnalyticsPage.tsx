import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { IndianRupee, ShoppingBag, TrendingUp } from 'lucide-react'
import { analyticsApi } from '@/services'
import { StatCard, ChartCard, AdminPageHeader, AdminSection } from '@/components/admin'
import { Skeleton } from '@/components/ui/loader'
import { formatPrice, formatCompact, capitalize } from '@/utils'
import { ORDER_STATUS_LABELS } from '@/constants'
import { cn } from '@/lib/utils'
import { staggerContainer } from '@/config/animations'
import type { RevenueDataPoint, TopCategory, TopProduct } from '@/types'

// ─── Analytics ──────────────────────────────────────────────────────────────────

function pointLabel(p: RevenueDataPoint): string {
  if (p.month) return p.month
  if (p.date) return p.date.slice(5) // MM-DD
  return ''
}

function soldOf(p: TopProduct): number {
  return p.totalSold ?? p.unitsSold ?? 0
}
function revOf(p: TopProduct): number {
  return p.totalRevenue ?? p.revenue ?? 0
}
function catRevOf(c: TopCategory): number {
  return c.totalRevenue ?? c.revenue ?? 0
}

export default function AnalyticsPage() {
  const revenueQ = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => analyticsApi.revenue().then((res) => res.data.data),
  })
  const ordersQ = useQuery({
    queryKey: ['analytics', 'orders'],
    queryFn: () => analyticsApi.orders().then((res) => res.data.data),
  })
  const topProductsQ = useQuery({
    queryKey: ['analytics', 'topProducts'],
    queryFn: () => analyticsApi.topProducts(10).then((res) => res.data.data),
  })
  const topCategoriesQ = useQuery({
    queryKey: ['analytics', 'topCategories'],
    queryFn: () => analyticsApi.topCategories().then((res) => res.data.data),
  })

  const revenue = revenueQ.data ?? []
  const maxRevenue = Math.max(1, ...revenue.map((p) => p.revenue))
  const totalRevenue = revenue.reduce((s, p) => s + p.revenue, 0)

  const orderStats = ordersQ.data
  const byStatus = orderStats?.byStatus ?? {}
  const maxStatus = Math.max(1, ...Object.values(byStatus))

  const topProducts = topProductsQ.data ?? []
  const topCategories = topCategoriesQ.data ?? []
  const maxCatRevenue = Math.max(1, ...topCategories.map(catRevOf))

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Analytics" description="Sales and performance insights" />

      {/* Stat cards */}
      {ordersQ.isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          <StatCard
            title="Total Revenue"
            value={formatPrice(orderStats?.totalRevenue ?? totalRevenue)}
            icon={IndianRupee}
            iconColor="success"
          />
          <StatCard
            title="Total Orders"
            value={(orderStats?.totalOrders ?? 0).toLocaleString('en-IN')}
            icon={ShoppingBag}
            iconColor="primary"
          />
          <StatCard
            title="Avg Order Value"
            value={formatPrice(orderStats?.averageOrderValue ?? 0)}
            icon={TrendingUp}
            iconColor="info"
          />
        </motion.div>
      )}

      {/* Revenue bar chart */}
      <ChartCard title="Revenue Over Time" subtitle="Revenue per period">
        {revenueQ.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : revenue.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No revenue data</p>
        ) : (
          <div className="flex h-64 items-end gap-2 overflow-x-auto">
            {revenue.map((p, i) => (
              <div key={i} className="flex min-w-[28px] flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="group relative w-full rounded-t-md bg-gradient-to-t from-slate-800 to-slate-500 transition-all hover:opacity-90"
                    style={{ height: `${(p.revenue / maxRevenue) * 100}%` }}
                  >
                    <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background group-hover:block">
                      {formatPrice(p.revenue)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">{pointLabel(p)}</span>
              </div>
            ))}
          </div>
        )}
      </ChartCard>

      {/* Orders by status */}
      <ChartCard title="Orders by Status" subtitle="Distribution across order lifecycle">
        {ordersQ.isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : Object.keys(byStatus).length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No order data</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-sm text-muted-foreground">
                  {ORDER_STATUS_LABELS[status] ?? capitalize(status)}
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
                  <div
                    className="flex h-full items-center justify-end rounded-md bg-gradient-to-r from-slate-800 to-slate-500 px-2"
                    style={{ width: `${Math.max((count / maxStatus) * 100, 6)}%` }}
                  >
                    <span className="text-xs font-semibold text-white">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top products */}
        <AdminSection title="Top Products">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {topProductsQ.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Sold</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-muted/30">
                      <td className="max-w-[200px] truncate px-4 py-2.5 text-sm text-foreground">
                        {p.name}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm text-muted-foreground">
                        {formatCompact(soldOf(p))}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-medium text-foreground">
                        {formatPrice(revOf(p))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </AdminSection>

        {/* Top categories */}
        <AdminSection title="Top Categories">
          <div className="rounded-2xl border border-border bg-card p-6">
            {topCategoriesQ.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : topCategories.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-4">
                {topCategories.map((c) => {
                  const rev = catRevOf(c)
                  return (
                    <div key={c._id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate text-foreground">{c.name}</span>
                        <span className="font-medium text-foreground">{formatPrice(rev)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full bg-gradient-to-r from-slate-800 to-slate-500'
                          )}
                          style={{ width: `${(rev / maxCatRevenue) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </AdminSection>
      </div>
    </div>
  )
}
