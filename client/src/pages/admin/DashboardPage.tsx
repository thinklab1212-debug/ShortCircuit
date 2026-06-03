import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  IndianRupee,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { analyticsApi } from '@/services'
import {
  StatCard,
  AdminPageHeader,
  AdminSection,
  StatusIndicator,
} from '@/components/admin'
import { Badge } from '@/components/ui/badge'
import { ErrorFallback } from '@/components/ui/error'
import { Skeleton } from '@/components/ui/loader'
import { formatPrice, formatDate, getUserName } from '@/utils'
import { ORDER_STATUS_LABELS } from '@/constants'
import { staggerContainer } from '@/config/animations'
import type { Order, User } from '@/types'

// ─── Admin Dashboard ────────────────────────────────────────────────────────────

function customerName(user: Order['user']): string {
  if (!user) return 'Guest'
  if (typeof user === 'string') return user
  const name = getUserName(user as User)
  return name || (user as User).email || 'Customer'
}

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => analyticsApi.dashboard().then((res) => res.data.data),
  })

  if (isError) {
    return (
      <ErrorFallback
        error={error as Error}
        resetErrorBoundary={() => void refetch()}
      />
    )
  }

  const recentOrders = data?.recentOrders ?? []
  const lowStock = data?.lowStockProducts ?? []

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your store's performance"
      />

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            title="Total Revenue"
            value={formatPrice(data?.totalRevenue ?? 0)}
            change={data?.revenueGrowth}
            changeLabel="vs last period"
            icon={IndianRupee}
            iconColor="success"
          />
          <StatCard
            title="Total Orders"
            value={(data?.totalOrders ?? 0).toLocaleString('en-IN')}
            change={data?.orderGrowth}
            changeLabel="vs last period"
            icon={ShoppingBag}
            iconColor="primary"
          />
          <StatCard
            title="Products"
            value={(data?.totalProducts ?? 0).toLocaleString('en-IN')}
            icon={Package}
            iconColor="info"
          />
          <StatCard
            title="Customers"
            value={(data?.totalUsers ?? 0).toLocaleString('en-IN')}
            icon={Users}
            iconColor="warning"
          />
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <AdminSection className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                No recent orders
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {order.orderId}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {customerName(order.user)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {formatPrice(order.totalPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="secondary" size="sm">
                          {ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </AdminSection>

        {/* Low stock */}
        <AdminSection>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Low Stock</h2>
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card p-2">
            {isLoading ? (
              <div className="space-y-3 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : lowStock.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-muted-foreground">
                <AlertTriangle className="h-6 w-6 text-muted-foreground/50" />
                All products are well stocked
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {lowStock.map((product) => (
                  <li
                    key={product._id}
                    className="flex items-center justify-between gap-3 px-2 py-2.5"
                  >
                    <Link
                      to={`/admin/products/${product._id}/edit`}
                      className="truncate text-sm font-medium text-foreground hover:text-primary"
                    >
                      {product.name}
                    </Link>
                    {product.stock <= 0 ? (
                      <StatusIndicator status="error" label="Out of stock" />
                    ) : (
                      <Badge variant="warning" size="sm">
                        {product.stock} left
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </AdminSection>
      </div>
    </div>
  )
}
