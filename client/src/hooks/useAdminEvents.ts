import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'
import { eventApi } from '@/services'
import queryKeys from '@/api/queryKeys'
import type { AxiosErrorLike } from '@/types/helpers'

function errMsg(error: AxiosErrorLike, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback
}

// ─── Admin Events Hooks ─────────────────────────────────────────────────────────

/** Fetches events list for admin management. */
export function useAdminEvents(params: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: queryKeys.adminEvents.list(params),
    queryFn: () =>
      eventApi.adminGetAllEvents(params).then((res) => ({
        events: res.data.data,
        pagination: res.data.pagination,
      })),
  })
}

/** Fetches detailed event records for admin management. */
export function useAdminEventDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.adminEvents.detail(id),
    queryFn: () => eventApi.adminGetEventById(id).then((res) => res.data.data),
    enabled: !!id,
  })
}

/** Approves an event. */
export function useApproveEvent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (id: string) => eventApi.adminApproveEvent(id).then((res) => res.data.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminEvents.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.adminEvents.detail(id) })
      toast.success('Event approved successfully!')
      navigate('/admin/events')
    },
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Could not approve event.')),
  })
}

/** Rejects an event. */
export function useRejectEvent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      eventApi.adminRejectEvent(id, rejectionReason).then((res) => res.data.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminEvents.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.adminEvents.detail(variables.id) })
      toast.success('Event rejected successfully!')
      navigate('/admin/events')
    },
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Could not reject event.')),
  })
}
