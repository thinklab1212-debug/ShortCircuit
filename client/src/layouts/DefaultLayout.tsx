import { Outlet } from 'react-router'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { AuthModal } from '@/components/auth'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'

// ─── Default Layout (Public + Authenticated Pages) ──────────────────────────────

export function DefaultLayout() {
  // Keep cart + wishlist stores hydrated app-wide (no-op until authenticated)
  // so the navbar badges and product-card heart states are always accurate.
  useCart()
  useWishlist()

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AuthModal />
    </div>
  )
}
