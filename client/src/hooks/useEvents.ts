import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'
import { eventApi } from '@/services'
import queryKeys from '@/api/queryKeys'
import type { CreateEventData } from '@/services/eventApi'
import type { AxiosErrorLike } from '@/types/helpers'

function errMsg(error: AxiosErrorLike, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback
}

// ─── Organizer Event Hooks ──────────────────────────────────────────────────────

/** Fetches the organizer's own events (paginated). */
export function useMyEvents(params: {
  page?: number
  limit?: number
  status?: string
}) {
  return useQuery({
    queryKey: queryKeys.organizerEvents.list(params),
    queryFn: () =>
      eventApi.getMyEvents(params).then((res) => ({
        events: res.data.data,
        pagination: res.data.pagination,
      })),
  })
}

/** Fetches a single event by ID. */
export function useEventDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.organizerEvents.detail(id),
    queryFn: () => eventApi.getById(id).then((res) => res.data.data),
    enabled: !!id,
  })
}

/** Creates a new event. */
export function useCreateEvent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: CreateEventData) =>
      eventApi.create(data).then((res) => res.data.data),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerEvents.all })
      toast.success('Event created successfully!')
      navigate(`/organizer/events/${event._id}`)
    },
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Could not create event')),
  })
}

/** Updates a draft event. */
export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEventData> }) =>
      eventApi.update(id, data).then((res) => res.data.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerEvents.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerEvents.detail(variables.id) })
      toast.success('Event updated successfully!')
    },
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Could not update event')),
  })
}

/** Deletes a draft event. */
export function useDeleteEvent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (id: string) => eventApi.delete(id).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerEvents.all })
      toast.success('Event deleted successfully!')
      navigate('/organizer/events')
    },
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Could not delete event')),
  })
}

/** Submits a draft event for admin review. */
export function useSubmitEventForReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      eventApi.submitForReview(id).then((res) => res.data.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerEvents.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerEvents.detail(id) })
      toast.success('Event submitted for review!')
    },
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Could not submit event for review')),
  })
}
