import { motion } from 'framer-motion'
import { PackageSearch, RefreshCw } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ProductGridCard } from '@/components/ui/product-card'
import { ProductListCard } from '@/components/ui/product-card'
import { Button } from '@/components/ui/button'
import { useShopFilters } from '@/hooks/useShopFilters'
import { useProducts } from '@/hooks/useProducts'
import { useCategories, useBrands } from '@/hooks/useHomeData'
import { useProductActions } from '@/hooks/useProductActions'
import {
  FilterSidebar,
  ActiveFilterTags,
  SortControls,
  ShopSearch,
  MobileFilterDrawer,
  ShopPagination,
} from './components'
import { staggerContainer, fadeInUp } from '@/config/animations'

// ─── Product Grid Skeleton ──────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="flex items-center gap-2">
          <div className="h-3 w-12 skeleton rounded" />
          <div className="h-3 w-8 skeleton rounded" />
        </div>
        <div className="h-5 w-20 skeleton rounded" />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="h-44 w-44 shrink-0 skeleton rounded-xl" />
      <div className="flex-1 space-y-3 py-2">
        <div className="h-3 w-20 skeleton rounded" />
        <div className="h-5 w-3/4 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-3 w-16 skeleton rounded" />
        <div className="h-6 w-24 skeleton rounded mt-auto" />
      </div>
    </div>
  )
}

// ─── Shop Page ──────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const { filters, setFilters, clearFilters, activeFilterCount } = useShopFilters()
  const { data, isLoading, isError, refetch, isFetching } = useProducts(filters)
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const { onAddToCart, onWishlistToggle, isInWishlist } = useProductActions()

  const products = data?.data || []
  const pagination = data?.pagination
  const isListView = filters.view === 'list'

  // Build breadcrumb
  const breadcrumbItems: { label: string; href?: string }[] = [{ label: 'Shop', href: '/shop' }]
  if (filters.search) {
    breadcrumbItems.push({ label: `Search: "${filters.search}"` })
  }

  return (
    <div className="container py-6 lg:py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-display-xs sm:text-display-sm font-heading text-foreground">
          {filters.search ? `Results for "${filters.search}"` : 'All Products'}
        </h1>
        <p className="mt-1 text-body-md text-muted-foreground">
          Discover the latest electronics and gadgets
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <ShopSearch
          value={filters.search || ''}
          onChange={(search) => setFilters({ search })}
          className="max-w-lg"
        />
      </div>

      {/* Main Layout */}
      <div className="flex gap-8">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block w-[260px] shrink-0">
          <div className="sticky top-24">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              onClear={clearFilters}
              activeCount={activeFilterCount}
            />
          </div>
        </div>

        {/* Product Area */}
        <div className="flex-1 min-w-0">
          {/* Toolbar: Mobile Filter + Sort + View */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <MobileFilterDrawer
              filters={filters}
              onFilterChange={setFilters}
              onClear={clearFilters}
              activeCount={activeFilterCount}
            />
            <SortControls
              filters={filters}
              onFilterChange={setFilters}
              total={pagination?.totalResults}
              className="flex-1"
            />
          </div>

          {/* Active Filter Tags */}
          {activeFilterCount > 0 && (
            <div className="mb-4">
              <ActiveFilterTags
                filters={filters}
                onFilterChange={setFilters}
                onClear={clearFilters}
                categories={categories}
                brands={brands}
              />
            </div>
          )}

          {/* Loading indicator for background refetch */}
          {isFetching && !isLoading && (
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Updating...
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className={
              isListView
                ? 'space-y-4'
                : 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'
            }>
              {Array.from({ length: 6 }).map((_, i) =>
                isListView ? <ListSkeleton key={i} /> : <ProductSkeleton key={i} />
              )}
            </div>
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-50 dark:bg-error-950/50 mb-4">
                <PackageSearch className="h-8 w-8 text-error-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Unable to load products</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Something went wrong while fetching products. Please try again.
              </p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && products.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <PackageSearch className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Try adjusting your filters or search terms to find what you're looking for.
              </p>
              {activeFilterCount > 0 && (
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              )}
            </div>
          )}

          {/* Product Grid */}
          {!isLoading && !isError && products.length > 0 && (
            <>
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                key={`${filters.page}-${filters.sort}-${filters.view}`}
                className={
                  isListView
                    ? 'space-y-4'
                    : 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'
                }
              >
                {products.map((product) => (
                  <motion.div key={product._id} variants={fadeInUp}>
                    {isListView ? (
                      <ProductListCard
                        product={product}
                        isWishlisted={isInWishlist(product._id)}
                        onAddToCart={onAddToCart}
                        onWishlistToggle={onWishlistToggle}
                      />
                    ) : (
                      <ProductGridCard
                        product={product}
                        isWishlisted={isInWishlist(product._id)}
                        onAddToCart={onAddToCart}
                        onWishlistToggle={onWishlistToggle}
                      />
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {pagination && (
                <ShopPagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.totalResults}
                  limit={pagination.limit}
                  onPageChange={(page) => setFilters({ page })}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
