import { create } from 'zustand'
import type { Product } from '@/types'

// ─── Wishlist Store ─────────────────────────────────────────────────────────────
// Holds the user's wishlisted products, kept in sync by the useWishlist hook.
// Powers the navbar badge and the heart toggle state across product cards.

interface WishlistState {
  products: Product[]
  isLoading: boolean

  setWishlist: (products: Product[]) => void
  setLoading: (loading: boolean) => void
  clearWishlist: () => void
  isInWishlist: (productId: string) => boolean
}

const useWishlistStore = create<WishlistState>()((set, get) => ({
  products: [],
  isLoading: false,

  setWishlist: (products) => set({ products }),

  setLoading: (isLoading) => set({ isLoading }),

  clearWishlist: () => set({ products: [] }),

  isInWishlist: (productId) => get().products.some((p) => p._id === productId),
}))

export default useWishlistStore
