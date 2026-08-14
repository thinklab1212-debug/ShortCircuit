import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { deliveryPincodeApi } from '@/services'
import queryKeys from '@/api/queryKeys'
import type { DeliveryPincodeFormData, PincodeCheckResult } from '@/types'
import type { AxiosErrorLike } from '@/types/helpers'

function errMsg(error: AxiosErrorLike, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback
}

// ─── Customer: Check Pincode ─────────────────────────────────────────────────

/**
 * Mutation for customer pincode serviceability check.
 * Does not toast on error — caller handles display.
 */
export function useCheckPincode() {
  return useMutation({
    mutationFn: (pincode: string) =>
      deliveryPincodeApi.check(pincode).then((res) => res.data.data as PincodeCheckResult),
  })
}

// ─── Admin: List Delivery Pincodes ──────────────────────────────────────────

export function useAdminDeliveryPincodes(params: {
  page?: number
  limit?: number
  search?: string
  isActive?: string
}) {
  return useQuery({
    queryKey: queryKeys.deliveryPincodes.list(params),
    queryFn: () => deliveryPincodeApi.adminGetAll(params).then((res) => res.data),
    placeholderData: (prev) => prev,
  })
}

// ─── Admin: Create ──────────────────────────────────────────────────────────

export function useCreateDeliveryPincode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DeliveryPincodeFormData) =>
      deliveryPincodeApi.adminCreate(data).then((res) => res.data.data),
    onSuccess: () => {
      toast.success('Delivery pincode added')
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveryPincodes.all })
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not add pincode')),
  })
}

// ─── Admin: Update ──────────────────────────────────────────────────────────

export function useUpdateDeliveryPincode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DeliveryPincodeFormData> }) =>
      deliveryPincodeApi.adminUpdate(id, data).then((res) => res.data.data),
    onSuccess: () => {
      toast.success('Delivery pincode updated')
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveryPincodes.all })
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not update pincode')),
  })
}

// ─── Admin: Toggle Status ───────────────────────────────────────────────────

export function useToggleDeliveryPincodeStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      deliveryPincodeApi.adminToggleStatus(id, isActive).then((res) => res.data.data),
    onSuccess: (_data, variables) => {
      toast.success(`Pincode ${variables.isActive ? 'enabled' : 'disabled'}`)
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveryPincodes.all })
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not update status')),
  })
}

// ─── Admin: Delete ──────────────────────────────────────────────────────────

export function useDeleteDeliveryPincode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deliveryPincodeApi.adminDelete(id),
    onSuccess: () => {
      toast.success('Delivery pincode deleted')
      queryClient.invalidateQueries({ queryKey: queryKeys.deliveryPincodes.all })
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not delete pincode')),
  })
}
