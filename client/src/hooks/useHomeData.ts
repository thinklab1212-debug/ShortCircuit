import { useQuery } from '@tanstack/react-query'
import queryKeys from '@/api/queryKeys'
import { productApi, categoryApi, brandApi, bannerApi } from '@/services'

// ─── Homepage Data Hooks ────────────────────────────────────────────────────────

export function useFeaturedProducts() {
  return useQuery({
    queryKey: queryKeys.products.featured(),
    queryFn: () => productApi.getFeatured().then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useNewArrivals() {
  return useQuery({
    queryKey: [...queryKeys.products.all, 'new-arrivals'],
    queryFn: () =>
      productApi
        .getAll({ sort: '-createdAt', limit: 8 })
        .then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useBestSellers() {
  return useQuery({
    queryKey: [...queryKeys.products.all, 'best-sellers'],
    queryFn: () =>
      productApi
        .getAll({ sort: '-soldCount', limit: 8 })
        .then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoryApi.getAll().then((res) => res.data.data),
    staleTime: 10 * 60 * 1000,
  })
}

export function useBrands() {
  return useQuery({
    queryKey: queryKeys.brands.all,
    queryFn: () => brandApi.getAll().then((res) => res.data.data),
    staleTime: 10 * 60 * 1000,
  })
}

export function useActiveBanners() {
  return useQuery({
    queryKey: queryKeys.banners.active(),
    queryFn: () => bannerApi.getActive().then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  })
}
