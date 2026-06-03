import { motion } from 'framer-motion'
import { ProductGridCard } from '@/components/ui/product-card'
import { staggerContainer, fadeInUp } from '@/config/animations'
import { useProductActions } from '@/hooks/useProductActions'
import { SectionHeader } from './SectionHeader'
import type { Product } from '@/types'

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

// ─── Product Section ────────────────────────────────────────────────────────────

interface ProductSectionProps {
  title: string
  subtitle?: string
  link?: string
  linkText?: string
  products: Product[] | undefined
  isLoading: boolean
  isError: boolean
  columns?: number
}

export default function ProductSection({
  title,
  subtitle,
  link,
  linkText,
  products,
  isLoading,
  isError,
  columns = 4,
}: ProductSectionProps) {
  const { onAddToCart, onWishlistToggle, isInWishlist } = useProductActions()
  const gridCols = {
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  }[columns] || 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

  return (
    <section className="py-16 lg:py-20">
      <div className="container">
        <SectionHeader title={title} subtitle={subtitle} link={link} linkText={linkText} />

        {isLoading && (
          <div className={`grid grid-cols-2 ${gridCols} gap-4 lg:gap-6`}>
            {Array.from({ length: columns * 2 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Unable to load products. Please try again later.</p>
          </div>
        )}

        {!isLoading && !isError && products && products.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-50px' }}
            className={`grid grid-cols-2 ${gridCols} gap-4 lg:gap-6`}
          >
            {products.map((product) => (
              <motion.div key={product._id} variants={fadeInUp}>
                <ProductGridCard
                  product={product}
                  isWishlisted={isInWishlist(product._id)}
                  onAddToCart={onAddToCart}
                  onWishlistToggle={onWishlistToggle}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {!isLoading && !isError && products && products.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No products found.</p>
          </div>
        )}
      </div>
    </section>
  )
}
