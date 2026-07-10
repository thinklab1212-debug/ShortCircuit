import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { eventApi } from '@/services'
import queryKeys from '@/api/queryKeys'
import type { AxiosErrorLike } from '@/types/helpers'

function errMsg(error: AxiosErrorLike, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback
}

// ─── Organizer Teams Hooks ──────────────────────────────────────────────────────

/** Fetches paginated teams and stats for an event. */
export function useTeams(
  eventId: string,
  params: { page?: number; limit?: number; search?: string; status?: string }
) {
  return useQuery({
    queryKey: queryKeys.organizerTeams.list(eventId, params),
    queryFn: () =>
      eventApi.getTeams(eventId, params).then((res) => {
        // Return wrapped structure
        const dataPayload = res.data.data as any
        return {
          teams: dataPayload.teams || [],
          stats: dataPayload.stats || { totalTeams: 0, purchasedTeams: 0, remainingTeams: 0 },
          pagination: res.data.pagination,
        }
      }),
    enabled: !!eventId,
  })
}

/** Previews uploaded CSV teams. */
export function usePreviewTeams() {
  return useMutation({
    mutationFn: ({ eventId, file }: { eventId: string; file: File }) =>
      eventApi.previewTeams(eventId, file).then((res) => res.data.data),
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Failed to parse CSV preview.')),
  })
}

/** Imports the valid previewed teams. */
export function useImportTeams() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, teams }: { eventId: string; teams: { teamId: string; leaderName: string }[] }) =>
      eventApi.importTeams(eventId, teams).then((res) => res.data.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerTeams.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerEvents.detail(variables.eventId) })
      toast.success('Teams imported successfully!')
    },
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Failed to import teams.')),
  })
}

/** Updates a single team's leader name. */
export function useUpdateTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, teamId, leaderName }: { eventId: string; teamId: string; leaderName: string }) =>
      eventApi.updateTeam(eventId, teamId, leaderName).then((res) => res.data.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerTeams.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerEvents.detail(variables.eventId) })
      toast.success('Team updated successfully!')
    },
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Failed to update team.')),
  })
}

/** Deletes a team. */
export function useDeleteTeam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, teamId }: { eventId: string; teamId: string }) =>
      eventApi.deleteTeam(eventId, teamId).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerTeams.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerEvents.detail(variables.eventId) })
      toast.success('Team deleted successfully!')
    },
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Failed to delete team.')),
  })
}

/** Clears all teams except purchased ones. */
export function useClearTeams() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => eventApi.clearTeams(eventId).then((res) => res.data),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerTeams.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.organizerEvents.detail(eventId) })
      toast.success('Teams cleared successfully!')
    },
    onError: (error: AxiosErrorLike) =>
      toast.error(errMsg(error, 'Failed to clear teams.')),
  })
}
