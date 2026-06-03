import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  LogOut,
  Package,
  MapPin,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Zap,
} from 'lucide-react'
import { useAuthStore, useCartStore, useUIStore } from '@/store'
import { useTheme } from '@/hooks'
import { useIsMobile } from '@/hooks'
import { cn } from '@/lib/utils'
import { getUserName } from '@/utils'
import { APP } from '@/constants'
import { BrandLogo } from '@/components/layout/BrandLogo'

// ─── Navbar ─────────────────────────────────────────────────────────────────────

export function Navbar() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()
  const { totalItems } = useCartStore()
  const { isMobileMenuOpen, setMobileMenuOpen, openAuthModal } = useUIStore()
  const { theme, setTheme } = useTheme()
  const isMobile = useIsMobile()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
    navigate('/')
  }

  const themeIcon = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  }

  const nextTheme = {
    light: 'dark' as const,
    dark: 'system' as const,
    system: 'light' as const,
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <BrandLogo size="md" />
            <span className="text-xl font-bold font-heading text-foreground hidden sm:inline">
              {APP.NAME}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/shop">Shop</NavLink>
            <NavLink href="/categories">Categories</NavLink>
            <NavLink href="/brands">Brands</NavLink>
            <NavLink href="/deals">Deals</NavLink>
          </nav>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 rounded-full border border-border/70 bg-background/70 backdrop-blur-sm pl-10 pr-4 text-sm outline-none transition-all focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-primary/20"
              />
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Mobile Search */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(nextTheme[theme])}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label={`Switch to ${nextTheme[theme]} theme`}
            >
              {themeIcon[theme]}
            </button>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Profile / Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex h-10 items-center gap-2 rounded-full pl-1 pr-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/12 text-primary text-xs font-semibold">
                    {user?.firstName?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isProfileOpen && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-popover p-1.5 shadow-lg"
                    >
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{getUserName(user)}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                      <DropdownLink href="/profile" icon={<User className="h-4 w-4" />} onClick={() => setIsProfileOpen(false)}>
                        My Profile
                      </DropdownLink>
                      <DropdownLink href="/orders" icon={<Package className="h-4 w-4" />} onClick={() => setIsProfileOpen(false)}>
                        My Orders
                      </DropdownLink>
                      <DropdownLink href="/addresses" icon={<MapPin className="h-4 w-4" />} onClick={() => setIsProfileOpen(false)}>
                        Addresses
                      </DropdownLink>
                      {user?.role === 'admin' && (
                        <>
                          <div className="my-1 border-t border-border" />
                          <DropdownLink href="/admin" icon={<Zap className="h-4 w-4" />} onClick={() => setIsProfileOpen(false)}>
                            Admin Dashboard
                          </DropdownLink>
                        </>
                      )}
                      <div className="my-1 border-t border-border" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-all hover:bg-foreground/90 active:scale-[0.98]"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <AnimatePresence>
          {isSearchOpen && isMobile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border overflow-hidden"
            >
              <form onSubmit={handleSearch} className="container py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full h-10 rounded-full border border-border/70 bg-background/70 backdrop-blur-sm pl-10 pr-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 z-30 h-full w-72 border-l border-border bg-background p-6 shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-bold font-heading">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)}>Home</MobileNavLink>
                <MobileNavLink href="/shop" onClick={() => setMobileMenuOpen(false)}>Shop</MobileNavLink>
                <MobileNavLink href="/categories" onClick={() => setMobileMenuOpen(false)}>Categories</MobileNavLink>
                <MobileNavLink href="/brands" onClick={() => setMobileMenuOpen(false)}>Brands</MobileNavLink>
                <MobileNavLink href="/deals" onClick={() => setMobileMenuOpen(false)}>Deals</MobileNavLink>
                {!isAuthenticated && (
                  <>
                    <div className="my-3 border-t border-border" />
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        openAuthModal('login')
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground w-full"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      to={href}
      className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className="flex items-center px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
    >
      {children}
    </Link>
  )
}

function DropdownLink({
  href,
  icon,
  onClick,
  children,
}: {
  href: string
  icon: React.ReactNode
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    >
      {icon}
      {children}
    </Link>
  )
}
