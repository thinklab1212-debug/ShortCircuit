import { useState } from 'react'
import { useParams } from 'react-router'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react'
import { useCategories, useProducts, useAddToCart, useToggleWishlist } from '@/hooks'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { ProductGridCard } from '@/components/ui/product-card'
import { EmptyState } from '@/components/ui/error'
import { staggerContainer, fadeInUp } from '@/config/animations'

const SORT_OPTIONS = [
  { label: 'Newest', value: '-createdAt' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Top Rated', value: '-ratingsAverage' },
]

function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-square skeleton" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-16 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-5 w-20 skeleton rounded" />
      </div>
    </div>
  )
}

export default function CategoryProductsPage() {
  const { slug } = useParams<{ slug: string }>()
  const [sort, setSort] = useState('-createdAt')
  const [page, setPage] = useState(1)

  const { data: categories } = useCategories()
  const category = categories?.find((c) => c.slug === slug)

  const { data, isLoading, isError } = useProducts({
    category: slug,
    page,
    limit: 12,
    sort,
  })

  const addToCart = useAddToCart()
  const toggleWishlist = useToggleWishlist()

  const products = data?.data || []
  const pagination = data?.pagination
  const title = category?.name || 'Category'

  return (
    <div className="container py-6 lg:py-8">
      <Breadcrumb
        items={[{ label: 'Categories', href: '/categories' }, { label: title }]}
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-display-xs font-heading text-foreground sm:text-display-sm">{title}</h1>
          {category?.description ? (
            <p className="mt-1 max-w-2xl text-body-md text-muted-foreground">{category.description}</p>
          ) : (
            <p className="mt-1 text-body-md text-muted-foreground">
              {pagination ? `${pagination.totalResults} products` : 'Browse products in this category'}
            </p>
          )}
        </div>

        {/* Sort */}
        <div className="w-full sm:w-56">
          <Select
            aria-label="Sort products"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value)
              setPage(1)
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <EmptyState
          icon={<PackageSearch className="h-8 w-8 text-error-500" />}
          title="Unable to load products"
          description="Something went wrong while fetching products. Please try again."
        />
      )}

      {/* Empty */}
      {!isLoading && !isError && products.length === 0 && (
        <EmptyState
          icon={<PackageSearch className="h-8 w-8 text-muted-foreground" />}
          title="No products found"
          description="There are no products in this category yet. Check back soon."
        />
      )}

      {/* Grid */}
      {!isLoading && !isError && products.length > 0 && (
        <>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            key={`${page}-${sort}`}
            className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4"
          >
            {products.map((product) => (
              <motion.div key={product._id} variants={fadeInUp}>
                <ProductGridCard
                  product={product}
                  onAddToCart={(productId) => addToCart.mutate({ productId, quantity: 1 })}
                  onWishlistToggle={(productId) => toggleWishlist.mutate(productId)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
