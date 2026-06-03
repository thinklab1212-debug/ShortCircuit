import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { addressApi } from '@/services'
import { useAuthStore } from '@/store'
import type { AddressFormData } from '@/types'
import type { AxiosErrorLike } from '@/types/helpers'

const ADDRESS_KEY = ['addresses'] as const

function errMsg(error: AxiosErrorLike, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback
}

export function useAddresses() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: ADDRESS_KEY,
    queryFn: () => addressApi.getAll().then((res) => res.data.data),
    enabled: isAuthenticated,
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AddressFormData) => addressApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      toast.success('Address added')
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEY })
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not add address')),
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressFormData> }) =>
      addressApi.update(id, data).then((res) => res.data.data),
    onSuccess: () => {
      toast.success('Address updated')
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEY })
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not update address')),
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => addressApi.remove(id),
    onSuccess: () => {
      toast.success('Address deleted')
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEY })
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not delete address')),
  })
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => addressApi.setDefault(id).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEY })
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not set default')),
  })
}
