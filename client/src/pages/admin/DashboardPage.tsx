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
  ShieldCheck,
  Tag,
  Calendar,
  Ticket,
  Receipt,
  BarChart3,
  Settings,
  Layers,
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
import { formatPrice, formatDate, getUserName, formatStatusLabel } from '@/utils'
import { staggerContainer } from '@/config/animations'
import type { Order, User } from '@/types'

// ─── Admin Dashboard ────────────────────────────────────────────────────────────

function customerName(user: Order['user']): string {
  if (!user) return 'Guest'
  if (typeof user === 'string') return user
  const name = getUserName(user as User)
  return name || (user as User).email || 'Customer'
}

const quickLinks = [
  { name: 'Products', path: '/admin/products', icon: Package, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
  { name: 'Users', path: '/admin/users', icon: Users, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
  { name: 'Categories', path: '/admin/categories', icon: Tag, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
  { name: 'Review Queue', path: '/admin/review-queue', icon: ShieldCheck, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
  { name: 'Events', path: '/admin/events', icon: Calendar, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
  { name: 'Project Kits', path: '/admin/project-kits', icon: Layers, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40' },
  { name: 'Coupons', path: '/admin/coupons', icon: Ticket, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40' },
  { name: 'Invoices', path: '/admin/invoices', icon: Receipt, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40' },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40' },
  { name: 'Settings', path: '/admin/settings', icon: Settings, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800/40' },
]

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
            changeLabel="vs last month"
            icon={IndianRupee}
            iconColor="success"
            to="/admin/analytics"
          />
          <StatCard
            title="Total Orders"
            value={(data?.totalOrders ?? 0).toLocaleString('en-IN')}
            change={data?.orderGrowth}
            changeLabel="vs last month"
            icon={ShoppingBag}
            iconColor="primary"
            to="/admin/orders"
          />
          <StatCard
            title="Products"
            value={(data?.totalProducts ?? 0).toLocaleString('en-IN')}
            icon={Package}
            iconColor="info"
            to="/admin/products"
          />
          <StatCard
            title="Customers"
            value={(data?.totalUsers ?? data?.totalCustomers ?? 0).toLocaleString('en-IN')}
            icon={Users}
            iconColor="warning"
            to="/admin/users"
          />
        </motion.div>
      )}

      {/* Quick Access Navigation */}
      <AdminSection title="Quick Management">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.path}
                to={link.path}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-card-hover"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${link.color}`}>
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {link.name}
                </span>
              </Link>
            )
          })}
        </div>
      </AdminSection>

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
                          {order.orderId || order._id}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        <Link
                          to="/admin/users"
                          className="hover:text-primary font-medium hover:underline"
                        >
                          {customerName(order.user)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {formatPrice(order.totalPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link to={`/admin/orders/${order._id}`}>
                          <Badge variant="secondary" size="sm" className="hover:opacity-80">
                            {formatStatusLabel(order.orderStatus)}
                          </Badge>
                        </Link>
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
                      <Link to={`/admin/products/${product._id}/edit`}>
                        <StatusIndicator status="error" label="Out of stock" />
                      </Link>
                    ) : (
                      <Link to={`/admin/products/${product._id}/edit`}>
                        <Badge variant="warning" size="sm">
                          {product.stock} left
                        </Badge>
                      </Link>
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
