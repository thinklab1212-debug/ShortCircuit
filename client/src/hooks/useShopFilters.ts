import { useSearchParams } from 'react-router'
import { useMemo, useCallback } from 'react'
import type { ProductFilters } from '@/types'

// ─── Shop Filter URL State ──────────────────────────────────────────────────────
// Syncs all filters, sorting, and pagination to URL search params

export interface ShopFilters extends ProductFilters {
  view?: 'grid' | 'list'
}

const DEFAULTS: ShopFilters = {
  page: 1,
  limit: 12,
  sort: '-createdAt',
  view: 'grid',
}

export function useShopFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<ShopFilters>(() => {
    const get = (key: string) => searchParams.get(key)
    return {
      page: Number(get('page')) || DEFAULTS.page,
      limit: Number(get('limit')) || DEFAULTS.limit,
      sort: get('sort') || DEFAULTS.sort,
      search: get('search') || undefined,
      category: get('category') || undefined,
      brand: get('brand') || undefined,
      minPrice: get('minPrice') ? Number(get('minPrice')) : undefined,
      maxPrice: get('maxPrice') ? Number(get('maxPrice')) : undefined,
      rating: get('rating') ? Number(get('rating')) : undefined,
      inStock: get('inStock') === 'true' ? true : undefined,
      isFeatured: get('featured') === 'true' ? true : undefined,
      view: (get('view') as 'grid' | 'list') || DEFAULTS.view,
    }
  }, [searchParams])

  const setFilters = useCallback(
    (updates: Partial<ShopFilters>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)

        // If changing a filter (not page), reset to page 1
        const isPageChange = Object.keys(updates).length === 1 && 'page' in updates
        if (!isPageChange && !('page' in updates)) {
          next.set('page', '1')
        }

        Object.entries(updates).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '' || value === false) {
            next.delete(key === 'isFeatured' ? 'featured' : key)
          } else {
            next.set(key === 'isFeatured' ? 'featured' : key, String(value))
          }
        })

        // Remove defaults to keep URLs clean
        if (next.get('page') === '1') next.delete('page')
        if (next.get('limit') === String(DEFAULTS.limit)) next.delete('limit')
        if (next.get('sort') === DEFAULTS.sort) next.delete('sort')
        if (next.get('view') === DEFAULTS.view) next.delete('view')

        return next
      }, { replace: true })
    },
    [setSearchParams]
  )

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.category) count++
    if (filters.brand) count++
    if (filters.minPrice !== undefined) count++
    if (filters.maxPrice !== undefined) count++
    if (filters.rating !== undefined) count++
    if (filters.inStock) count++
    if (filters.isFeatured) count++
    if (filters.search) count++
    return count
  }, [filters])

  return { filters, setFilters, clearFilters, activeFilterCount }
}
