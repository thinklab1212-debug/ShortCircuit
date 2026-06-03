import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import queryKeys from '@/api/queryKeys'
import { cartApi } from '@/services'
import { useAuthStore, useCartStore } from '@/store'
import type { AddToCartData, AxiosErrorLike } from '@/types/helpers'

function errMsg(error: AxiosErrorLike, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback
}

// ─── Cart Query (syncs the cart store) ──────────────────────────────────────────

export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setCart = useCartStore((s) => s.setCart)

  const query = useQuery({
    queryKey: queryKeys.cart.detail(),
    queryFn: () => cartApi.get().then((res) => res.data.data),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  })

  useEffect(() => {
    if (query.data) setCart(query.data)
  }, [query.data, setCart])

  return query
}

// ─── Cart Mutations ─────────────────────────────────────────────────────────────

export function useAddToCart() {
  const queryClient = useQueryClient()
  const setCart = useCartStore((s) => s.setCart)

  return useMutation({
    mutationFn: (data: AddToCartData) => cartApi.addItem(data).then((res) => res.data.data),
    onSuccess: (cart) => {
      setCart(cart)
      queryClient.setQueryData(queryKeys.cart.detail(), cart)
      toast.success('Added to cart')
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not add to cart')),
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  const setCart = useCartStore((s) => s.setCart)

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateItem(itemId, quantity).then((res) => res.data.data),
    onSuccess: (cart) => {
      setCart(cart)
      queryClient.setQueryData(queryKeys.cart.detail(), cart)
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not update item')),
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  const setCart = useCartStore((s) => s.setCart)

  return useMutation({
    mutationFn: (itemId: string) => cartApi.removeItem(itemId).then((res) => res.data.data),
    onSuccess: (cart) => {
      setCart(cart)
      queryClient.setQueryData(queryKeys.cart.detail(), cart)
      toast.success('Removed from cart')
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not remove item')),
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()
  const clearCart = useCartStore((s) => s.clearCart)

  return useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => {
      clearCart()
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
    },
  })
}

// ─── Cart Totals (with optional coupon) ─────────────────────────────────────────

export function useCartTotals(couponCode?: string, enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: [...queryKeys.cart.all, 'totals', couponCode ?? null],
    queryFn: () => cartApi.getTotals(couponCode).then((res) => res.data.data),
    enabled: isAuthenticated && enabled,
    staleTime: 15 * 1000,
  })
}
