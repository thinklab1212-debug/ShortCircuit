import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import queryKeys from '@/api/queryKeys'
import { productApi } from '@/services'
import reviewApi from '@/services/reviewApi'
import type { ReviewFormData } from '@/types'

// ─── Product by Slug ────────────────────────────────────────────────────────────

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: () => productApi.getBySlug(slug).then((res) => res.data.data),
    enabled: !!slug,
    staleTime: 3 * 60 * 1000,
  })
}

// ─── Related Products ───────────────────────────────────────────────────────────

export function useRelatedProducts(categoryId: string | undefined, excludeId: string) {
  return useQuery({
    queryKey: [...queryKeys.products.all, 'related', categoryId, excludeId],
    queryFn: () =>
      productApi
        .getAll({ category: categoryId, limit: 8 })
        .then((res) => res.data.data.filter((p) => p._id !== excludeId).slice(0, 4)),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Product Reviews ────────────────────────────────────────────────────────────

export function useProductReviews(productId: string, page = 1) {
  return useQuery({
    queryKey: [...queryKeys.reviews.byProduct(productId), page],
    queryFn: () => reviewApi.getByProduct(productId, { page, limit: 5 }).then((res) => res.data),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000,
  })
}

// ─── Create Review ──────────────────────────────────────────────────────────────

export function useCreateReview(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReviewFormData) => reviewApi.create(productId, data),
    onSuccess: () => {
      toast.success('Review submitted successfully!')
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.byProduct(productId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      toast.error(err.response?.data?.message || err.message || 'Failed to submit review')
    },
  })
}
