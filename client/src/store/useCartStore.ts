import { create } from 'zustand'
import type { Cart, CartItem } from '@/types'

// ─── Cart Store ─────────────────────────────────────────────────────────────────
// Mirror of the server cart, kept in sync by the useCart hook. Drives the navbar
// badge and lets components read totals without re-fetching.

function computeTotals(items: CartItem[]) {
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  return { totalItems, totalPrice }
}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  isLoading: boolean

  setCart: (cart: Pick<Cart, 'items' | 'totalItems' | 'totalPrice'> | null) => void
  setLoading: (loading: boolean) => void
  clearCart: () => void
}

const useCartStore = create<CartState>()((set) => ({
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,

  setCart: (cart) => {
    if (!cart) {
      set({ items: [], totalItems: 0, totalPrice: 0 })
      return
    }
    const items = cart.items ?? []
    const computed = computeTotals(items)
    set({
      items,
      totalItems: cart.totalItems ?? computed.totalItems,
      totalPrice: cart.totalPrice ?? computed.totalPrice,
    })
  },

  setLoading: (isLoading) => set({ isLoading }),

  clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),
}))

export default useCartStore
