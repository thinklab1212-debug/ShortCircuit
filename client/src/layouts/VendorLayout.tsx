import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP } from '@/constants'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { useIsMobile } from '@/hooks'
import { ScrollToTop } from '@/components/layout/ScrollToTop'

// ─── Vendor Layout ──────────────────────────────────────────────────────────────

const sidebarLinks = [
  { label: 'Dashboard', href: '/vendor', icon: LayoutDashboard },
  { label: 'Products', href: '/vendor/products', icon: Package },
  { label: 'Profile', href: '/vendor/profile', icon: User },
]

export function VendorLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isMobile = useIsMobile()

  const isActive = (href: string) => {
    if (href === '/vendor') return location.pathname === '/vendor'
    return location.pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ScrollToTop selector="#vendor-main" />
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
            <Link to="/vendor" className="flex items-center gap-2">
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
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{link.label}</span>}
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
        {/* Vendor Top Bar */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <span className="text-xs font-medium text-muted-foreground border border-border bg-muted/40 px-2.5 py-1 rounded-full">
            Vendor Panel
          </span>
        </header>

        {/* Page Content */}
        <main id="vendor-main" className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 } as const}
            animate={{ opacity: 1, y: 0 } as const}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
