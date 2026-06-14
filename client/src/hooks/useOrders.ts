import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import queryKeys from '@/api/queryKeys'
import { orderApi } from '@/services'
import { useAuthStore } from '@/store'
import type { CreateOrderData } from '@/types'
import type { AxiosErrorLike } from '@/types/helpers'

function errMsg(error: AxiosErrorLike, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback
}

export function useMyOrders(page = 1, limit = 10) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: queryKeys.orders.myOrders({ page, limit }),
    queryFn: () => orderApi.getMyOrders({ page, limit }).then((res) => res.data),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => orderApi.getById(id).then((res) => res.data.data),
    enabled: !!id,
  })
}

export function usePlaceOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrderData) => orderApi.place(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not place order')),
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      orderApi.cancel(id, reason).then((res) => res.data.data),
    onSuccess: (order) => {
      toast.success('Order cancelled')
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
      queryClient.setQueryData(queryKeys.orders.detail(order._id), order)
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not cancel order')),
  })
}

export function useRequestCancellation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, category, reason }: { id: string; category: string; reason: string }) =>
      orderApi.requestCancellation(id, { category, reason }).then((res) => res.data.data),
    onSuccess: (order) => {
      toast.success('Cancellation request submitted')
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
      queryClient.setQueryData(queryKeys.orders.detail(order._id), order)
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not submit cancellation request')),
  })
}
