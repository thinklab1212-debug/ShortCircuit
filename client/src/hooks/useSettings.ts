import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import queryKeys from '@/api/queryKeys'
import settingsApi, { SystemSettingsData } from '@/services/settingsApi'
import { useAuthStore } from '@/store'
import type { AxiosErrorLike } from '@/types/helpers'

function errMsg(error: AxiosErrorLike, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback
}

export function usePublicSettings() {
  return useQuery({
    queryKey: queryKeys.settings.public(),
    queryFn: () => settingsApi.getPublic().then((res) => res.data.data),
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000, // Poll status every 15s so maintenance mode status syncs automatically
  })
}

export function useAdminSettings() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'

  return useQuery({
    queryKey: queryKeys.settings.admin(),
    queryFn: () => settingsApi.getAdmin().then((res) => res.data.data),
    enabled: isAdmin,
    staleTime: 10 * 1000,
  })
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<SystemSettingsData>) =>
      settingsApi.updateAdmin(data).then((res) => res.data.data),
    onSuccess: (updated) => {
      toast.success('Store preferences updated')
      queryClient.setQueryData(queryKeys.settings.admin(), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.public() })
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Failed to update settings')),
  })
}
