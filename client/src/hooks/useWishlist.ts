import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import queryKeys from '@/api/queryKeys'
import { wishlistApi } from '@/services'
import { useAuthStore, useWishlistStore } from '@/store'
import type { AxiosErrorLike } from '@/types/helpers'

function errMsg(error: AxiosErrorLike, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback
}

// ─── Wishlist Query (syncs the wishlist store) ──────────────────────────────────

export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setWishlist = useWishlistStore((s) => s.setWishlist)

  const query = useQuery({
    queryKey: queryKeys.wishlist.detail(),
    queryFn: () => wishlistApi.get().then((res) => res.data.data),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    if (query.data?.products) setWishlist(query.data.products)
  }, [query.data, setWishlist])

  return query
}

// ─── Toggle / Remove ────────────────────────────────────────────────────────────

export function useToggleWishlist() {
  const queryClient = useQueryClient()
  const setWishlist = useWishlistStore((s) => s.setWishlist)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useMutation({
    mutationFn: (productId: string) => {
      if (!isAuthenticated) {
        return Promise.reject({ message: 'Please sign in to use your wishlist' })
      }
      return wishlistApi.toggle(productId).then((res) => res.data.data)
    },
    onSuccess: (wishlist) => {
      setWishlist(wishlist.products)
      queryClient.setQueryData(queryKeys.wishlist.detail(), wishlist)
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not update wishlist')),
  })
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient()
  const setWishlist = useWishlistStore((s) => s.setWishlist)

  return useMutation({
    mutationFn: (productId: string) => wishlistApi.remove(productId).then((res) => res.data.data),
    onSuccess: (wishlist) => {
      setWishlist(wishlist.products)
      queryClient.setQueryData(queryKeys.wishlist.detail(), wishlist)
      toast.success('Removed from wishlist')
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not remove item')),
  })
}
