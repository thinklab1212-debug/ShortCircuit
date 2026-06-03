import { useNavigate, useLocation } from 'react-router'
import toast from 'react-hot-toast'
import { useAddToCart } from './useCart'
import { useToggleWishlist } from './useWishlist'
import { useAuthStore, useWishlistStore } from '@/store'

/**
 * Shared add-to-cart / wishlist-toggle handlers for product cards across the
 * storefront (shop, home, catalog). Redirects guests to login.
 */
export function useProductActions() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInWishlist = useWishlistStore((s) => s.isInWishlist)
  const addToCart = useAddToCart()
  const toggleWishlist = useToggleWishlist()

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to continue')
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`)
      return false
    }
    return true
  }

  const onAddToCart = (productId: string) => {
    if (!requireAuth()) return
    addToCart.mutate({ productId, quantity: 1 })
  }

  const onWishlistToggle = (productId: string) => {
    if (!requireAuth()) return
    toggleWishlist.mutate(productId)
  }

  return { onAddToCart, onWishlistToggle, isInWishlist }
}
