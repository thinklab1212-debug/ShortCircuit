import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import queryKeys from '@/api/queryKeys'
import { projectKitApi } from '@/services'
import type { ProjectKitFormData } from '@/types'

function errMsg(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback
}

export function useProjectKits(filters: {
  page?: number
  limit?: number
  applicationArea?: string
  difficulty?: string
  search?: string
  sort?: string
}) {
  return useQuery({
    queryKey: queryKeys.projectKits.list(filters),
    queryFn: () => projectKitApi.list(filters).then((res) => res.data),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  })
}

export function useFeaturedProjectKits() {
  return useQuery({
    queryKey: queryKeys.projectKits.featured(),
    queryFn: () => projectKitApi.featured().then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useProjectKit(slug: string) {
  return useQuery({
    queryKey: queryKeys.projectKits.detail(slug),
    queryFn: () => projectKitApi.getBySlug(slug).then((res) => res.data.data),
    staleTime: 60 * 1000,
  })
}

export function useProjectBom(slug: string) {
  return useQuery({
    queryKey: queryKeys.projectKits.bom(slug),
    queryFn: () => projectKitApi.getBom(slug).then((res) => res.data.data),
    staleTime: 30 * 1000,
  })
}

export function useAddKitToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectKitApi.addToCart(id).then((res) => res.data.data),
    onSuccess: (result) => {
      // Invalidate cart details so it is re-fetched with the new items
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })

      // Custom toaster report
      const addedCount = result.added.length
      const failedCount = result.failed.length
      
      if (addedCount > 0 && failedCount === 0) {
        toast.success(`Successfully added ${addedCount} kit components to cart!`)
      } else if (addedCount > 0 && failedCount > 0) {
        toast.success(`Added ${addedCount} items, but ${failedCount} failed. Check stock!`)
      } else if (failedCount > 0) {
        toast.error(`Could not add items to cart. ${result.failed[0].reason}`)
      } else {
        toast.success('BOM processed. No new items added.')
      }
    },
    onError: (error: any) => toast.error(errMsg(error, 'Failed to add kit to cart')),
  })
}

// ── Admin Mutations ──

export function useAdminProjectKits(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...queryKeys.projectKits.all, 'admin', params ?? null],
    queryFn: () => projectKitApi.adminList(params).then((res) => res.data),
    placeholderData: keepPreviousData,
  })
}

export function useAdminProjectKitById(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...queryKeys.projectKits.all, 'admin-detail', id],
    queryFn: () => projectKitApi.adminGetById(id!).then((res) => res.data.data),
    enabled: enabled && !!id,
  })
}

export function useCreateProjectKit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProjectKitFormData) => projectKitApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectKits.all })
      toast.success('Project kit created successfully')
    },
    onError: (error: any) => toast.error(errMsg(error, 'Failed to create project kit')),
  })
}

export function useUpdateProjectKit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectKitFormData> }) =>
      projectKitApi.update(id, data).then((res) => res.data.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectKits.all })
      queryClient.setQueryData(queryKeys.projectKits.detail(updated.slug), updated)
      toast.success('Project kit updated successfully')
    },
    onError: (error: any) => toast.error(errMsg(error, 'Failed to update project kit')),
  })
}

export function useDeleteProjectKit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectKitApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectKits.all })
      toast.success('Project kit deleted successfully')
    },
    onError: (error: any) => toast.error(errMsg(error, 'Failed to delete project kit')),
  })
}
