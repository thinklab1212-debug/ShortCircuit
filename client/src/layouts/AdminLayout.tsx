import { useState, useEffect, Suspense } from 'react'
import { Outlet, Link, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronDown,
  Menu,
  Store,
  ClipboardCheck,
  Receipt,
  XCircle,
  Loader2,
  Cpu,
  Award,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP } from '@/constants'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { useIsMobile } from '@/hooks'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { useQuery } from '@tanstack/react-query'
import { orderApi } from '@/services'

// ─── Types & Navigation Config ──────────────────────────────────────────────────

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

type NavGroup = {
  id: string
  label: string
  icon: React.ElementType
  badge?: number
  items: NavItem[]
}

type SidebarEntry = NavItem | NavGroup

function isNavGroup(entry: SidebarEntry): entry is NavGroup {
  return 'items' in entry
}

const getSidebarNav = (pendingCancellationCount: number): SidebarEntry[] => [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  {
    id: 'catalog',
    label: 'Catalog',
    icon: Package,
    items: [
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Categories', href: '/admin/categories', icon: Tags },
      { label: 'Brands', href: '/admin/brands', icon: Building2 },
      { label: 'Project Kits', href: '/admin/project-kits', icon: Cpu },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & Orders',
    icon: ShoppingBag,
    badge: pendingCancellationCount,
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      {
        label: 'Cancellation Requests',
        href: '/admin/cancellation-requests',
        icon: XCircle,
        badge: pendingCancellationCount,
      },
      { label: 'Invoices', href: '/admin/invoices', icon: Receipt },
      { label: 'Delivery Pincodes', href: '/admin/delivery-pincodes', icon: MapPin },
    ],
  },
  {
    id: 'events',
    label: 'Events',
    icon: Award,
    items: [
      { label: 'Event Reviews', href: '/admin/events', icon: ClipboardCheck },
      { label: 'Event Orders', href: '/admin/events/orders', icon: ShoppingBag },
      { label: 'Organizer Applications', href: '/admin/organizer-applications', icon: Award },
    ],
  },
  {
    id: 'users-vendors',
    label: 'Users & Review',
    icon: Users,
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Vendors', href: '/admin/vendors', icon: Store },
      { label: 'Review Queue', href: '/admin/review-queue', icon: ClipboardCheck },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & Content',
    icon: Ticket,
    items: [
      { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
      { label: 'Banners', href: '/admin/banners', icon: Image },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    items: [
      { label: 'General Settings', href: '/admin/settings', icon: Settings },
      { label: 'Invoice Settings', href: '/admin/invoice-settings', icon: Receipt },
    ],
  },
]

import { AdminMaintenanceBanner } from '@/components/admin'

// ─── Admin Layout ───────────────────────────────────────────────────────────────


export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const location = useLocation()
  const isMobile = useIsMobile()

  const { data: countData } = useQuery({
    queryKey: ['admin', 'cancellation-requests', 'pending-count'],
    queryFn: () => orderApi.getPendingCancellationCount().then((res) => res.data.data),
    refetchInterval: 30000,
  })
  const pendingCount = countData?.count || 0
  const navEntries = getSidebarNav(pendingCount)

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/admin/events') return location.pathname === href
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const isGroupActive = (group: NavGroup) => {
    return group.items.some((item) => isActive(item.href))
  }

  // Auto-expand group containing current route
  useEffect(() => {
    navEntries.forEach((entry) => {
      if (isNavGroup(entry) && isGroupActive(entry)) {
        setOpenGroups((prev) => (prev.includes(entry.id) ? prev : [...prev, entry.id]))
      }
    })
  }, [location.pathname])

  const toggleGroup = (groupId: string) => {
    if (collapsed) {
      setCollapsed(false)
    }
    setOpenGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    )
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
            onClick={() => (isMobile ? setMobileOpen(false) : setCollapsed(!collapsed))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {navEntries.map((entry) => {
            if (!isNavGroup(entry)) {
              // Direct Link
              const Icon = entry.icon
              const active = isActive(entry.href)
              return (
                <Link
                  key={entry.href}
                  to={entry.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    active
                      ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                  title={collapsed ? entry.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{entry.label}</span>}
                  </div>
                  {!collapsed && entry.badge && entry.badge > 0 ? (
                    <span className="flex h-5 items-center justify-center rounded-full bg-error-500 px-2 text-[10px] font-bold text-white leading-none">
                      {entry.badge}
                    </span>
                  ) : null}
                </Link>
              )
            }

            // Accordion Group
            const GroupIcon = entry.icon
            const isOpen = openGroups.includes(entry.id)
            const groupActive = isGroupActive(entry)

            return (
              <div key={entry.id} className="space-y-0.5">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(entry.id)}
                  title={collapsed ? entry.label : undefined}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    groupActive
                      ? 'text-foreground font-semibold bg-accent/40'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <GroupIcon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        groupActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    {!collapsed && <span>{entry.label}</span>}
                  </div>
                  {!collapsed && (
                    <div className="flex items-center gap-1.5">
                      {entry.badge && entry.badge > 0 ? (
                        <span className="flex h-4 items-center justify-center rounded-full bg-error-500 px-1.5 text-[9px] font-bold text-white leading-none">
                          {entry.badge}
                        </span>
                      ) : null}
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                          isOpen ? 'rotate-180' : ''
                        )}
                      />
                    </div>
                  )}
                  {collapsed && entry.badge && entry.badge > 0 ? (
                    <span className="h-2 w-2 rounded-full bg-error-500" />
                  ) : null}
                </button>

                {/* Sub Items */}
                {!collapsed && (
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeInOut' }}
                        className="overflow-hidden pl-3 space-y-0.5 border-l border-border/50 ml-4 my-1"
                      >
                        {entry.items.map((subItem) => {
                          const SubIcon = subItem.icon
                          const active = isActive(subItem.href)

                          return (
                            <Link
                              key={subItem.href}
                              to={subItem.href}
                              onClick={() => isMobile && setMobileOpen(false)}
                              className={cn(
                                'flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
                                active
                                  ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                                  : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <SubIcon className="h-3.5 w-3.5 shrink-0" />
                                <span>{subItem.label}</span>
                              </div>
                              {subItem.badge && subItem.badge > 0 ? (
                                <span className="flex h-4 items-center justify-center rounded-full bg-error-500 px-1.5 text-[9px] font-bold text-white leading-none">
                                  {subItem.badge}
                                </span>
                              ) : null}
                            </Link>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
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
        <AdminMaintenanceBanner />
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
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

