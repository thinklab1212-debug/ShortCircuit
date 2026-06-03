import { useQuery, keepPreviousData } from '@tanstack/react-query'
import queryKeys from '@/api/queryKeys'
import { productApi } from '@/services'
import type { ProductFilters } from '@/types'

// ─── Products Query Hook ────────────────────────────────────────────────────────

export function useProducts(filters: ProductFilters) {
  // Build clean params object (strip undefined)
  const params: Record<string, string | number | boolean> = {}
  if (filters.page) params.page = filters.page
  if (filters.limit) params.limit = filters.limit
  if (filters.sort) params.sort = filters.sort
  if (filters.search) params.search = filters.search
  if (filters.category) params.category = filters.category
  if (filters.brand) params.brand = filters.brand
  if (filters.minPrice !== undefined) params.minPrice = filters.minPrice
  if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice
  if (filters.rating !== undefined) params.rating = filters.rating
  if (filters.inStock !== undefined) params.inStock = filters.inStock
  if (filters.isFeatured !== undefined) params.isFeatured = filters.isFeatured

  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productApi.getAll(filters).then((res) => res.data),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  })
}
