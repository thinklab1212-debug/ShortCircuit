import { useState, Suspense } from 'react'
import { Outlet, Link, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  Tags,
  Building2,
  ShoppingBag,
  Users,
  Ticket,
  Image,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Store,
  ClipboardCheck,
  Receipt,
  XCircle,
  Loader2,
  Cpu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP } from '@/constants'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { useIsMobile } from '@/hooks'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { useQuery } from '@tanstack/react-query'
import { orderApi } from '@/services'

// ─── Admin Layout ───────────────────────────────────────────────────────────────

const sidebarLinks = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: Tags },
  { label: 'Brands', href: '/admin/brands', icon: Building2 },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Cancellation Requests', href: '/admin/cancellation-requests', icon: XCircle },
  { label: 'Invoices', href: '/admin/invoices', icon: Receipt },
  { label: 'Project Kits', href: '/admin/project-kits', icon: Cpu },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Vendors', href: '/admin/vendors', icon: Store },
  { label: 'Review Queue', href: '/admin/review-queue', icon: ClipboardCheck },
  { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { label: 'Banners', href: '/admin/banners', icon: Image },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Invoice Settings', href: '/admin/invoice-settings', icon: Settings },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isMobile = useIsMobile()

  const { data: countData } = useQuery({
    queryKey: ['admin', 'cancellation-requests', 'pending-count'],
    queryFn: () => orderApi.getPendingCancellationCount().then((res) => res.data.data),
    refetchInterval: 30000,
  })
  const pendingCount = countData?.count || 0

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ScrollToTop selector="#admin-main" />
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <BrandLogo size="sm" />
              <span className="text-sm font-bold font-heading">{APP.NAME}</span>
            </Link>
          )}
          <button
            onClick={() => isMobile ? setMobileOpen(false) : setCollapsed(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)

            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => isMobile && setMobileOpen(false)}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </div>
                {!collapsed && link.label === 'Cancellation Requests' && pendingCount > 0 && (
                  <span className="flex h-5 items-center justify-center rounded-full bg-error-500 px-2 text-[10px] font-bold text-white leading-none">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Back to Store */}
        <div className="border-t border-border p-2">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Back to Store</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Admin Top Bar */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <span className="text-xs font-medium text-muted-foreground border border-border bg-muted/40 px-2.5 py-1 rounded-full">
            Admin Panel
          </span>
        </header>

        {/* Page Content */}
        <main id="admin-main" className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <Outlet />
            </Suspense>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
