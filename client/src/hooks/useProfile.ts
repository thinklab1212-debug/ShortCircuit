import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userApi } from '@/services'
import { useAuthStore } from '@/store'
import type { UpdateProfileData } from '@/types'
import type { AxiosErrorLike } from '@/types/helpers'

function errMsg(error: AxiosErrorLike, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (data: UpdateProfileData) => userApi.updateProfile(data).then((res) => res.data.data),
    onSuccess: (user) => {
      setUser(user)
      toast.success('Profile updated')
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not update profile')),
  })
}

export function useUpdateAvatar() {
  const updateUser = useAuthStore((s) => s.updateUser)
  return useMutation({
    mutationFn: (file: File) => userApi.updateAvatar(file).then((res) => res.data.data),
    onSuccess: (data) => {
      updateUser({ avatar: data.avatar })
      toast.success('Photo updated')
    },
    onError: (error: AxiosErrorLike) => toast.error(errMsg(error, 'Could not update photo')),
  })
}
