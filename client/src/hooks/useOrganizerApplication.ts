import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { organizerApi, adminOrganizerApi } from '@/services/organizerApi'
import { useAuthStore } from '@/store'
import queryKeys from '@/api/queryKeys'
import type { ApplyOrganizerData } from '@/types'
import type { AxiosErrorLike } from '@/types/helpers'

function errMsg(error: AxiosErrorLike, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback
}

// ─── Customer Hooks ─────────────────────────────────────────────────────────────

/** Fetches the current user's organizer application (or null if none). */
export function useMyOrganizerApplication() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return useQuery({
    queryKey: queryKeys.organizerApplications.mine(),
    queryFn: () => organizerApi.getMyApplication().then((res) => res.data.data),
    enabled: isAuthenticated,
  })
}

/** Submits a new organizer application (or reapplies after rejection). */
export function useApplyAsOrganizer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ApplyOrganizerData) =>
      organizerApi.apply(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerApplications.all })
      toast.success('Organizer application submitted successfully!')
    },
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Could not submit application')),
  })
}

// ─── Admin Hooks ────────────────────────────────────────────────────────────────

/** Fetches all organizer applications for admin (paginated). */
export function useOrganizerApplications(params: {
  page?: number
  limit?: number
  status?: string
}) {
  return useQuery({
    queryKey: queryKeys.organizerApplications.list(params),
    queryFn: () => adminOrganizerApi.getAll(params).then((res) => ({
      applications: res.data.data,
      pagination: res.data.pagination,
    })),
  })
}

/** Fetches a single organizer application by ID. */
export function useOrganizerApplicationDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.organizerApplications.detail(id),
    queryFn: () => adminOrganizerApi.getById(id).then((res) => res.data.data),
    enabled: !!id,
  })
}

/** Approves an organizer application. */
export function useApproveOrganizerApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, adminResponse }: { id: string; adminResponse?: string }) =>
      adminOrganizerApi.approve(id, { adminResponse }).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerApplications.all })
      toast.success('Organizer application approved!')
    },
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Could not approve application')),
  })
}

/** Rejects an organizer application with reason. */
export function useRejectOrganizerApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, adminResponse }: { id: string; adminResponse?: string }) =>
      adminOrganizerApi.reject(id, { adminResponse }).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerApplications.all })
      toast.success('Organizer application rejected.')
    },
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Could not reject application')),
  })
}
