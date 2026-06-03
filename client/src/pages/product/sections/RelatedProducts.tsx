import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { ProductGridCard } from '@/components/ui/product-card'
import { useRelatedProducts } from '@/hooks/useProductDetail'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { formatPrice } from '@/utils'
import { staggerContainer, fadeInUp } from '@/config/animations'

// ─── Related Products ───────────────────────────────────────────────────────────

interface RelatedProductsProps {
  categoryId: string | undefined
  currentProductId: string
}

export function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  const { data: products, isLoading } = useRelatedProducts(categoryId, currentProductId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold font-heading text-foreground">Related Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="aspect-square skeleton" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-full skeleton rounded" />
                <div className="h-5 w-20 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!products || products.length === 0) return null

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-heading text-foreground">Related Products</h2>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-50px' }}
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {products.map((product) => (
          <motion.div key={product._id} variants={fadeInUp}>
            <ProductGridCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Recently Viewed Products ───────────────────────────────────────────────────

interface RecentlyViewedProps {
  currentProductId: string
}

export function RecentlyViewedProducts({ currentProductId }: RecentlyViewedProps) {
  const { items } = useRecentlyViewed()
  const filtered = items.filter((p) => p._id !== currentProductId)

  if (filtered.length === 0) return null

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold font-heading text-foreground">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {filtered.map((product) => (
          <Link
            key={product._id}
            to={`/product/${product.slug}`}
            className="group shrink-0 w-44 rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-card-hover hover:-translate-y-0.5"
          >
            <div className="aspect-square bg-muted/30 overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-contain transition-transform group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="p-3 space-y-1.5">
              <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
                {product.name}
              </p>
              {product.ratingsCount > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-success-700 dark:text-success-400">
                    {product.ratingsAverage.toFixed(1)}
                  </span>
                  <Star className="h-2.5 w-2.5 fill-success-600 text-success-600 dark:fill-success-400 dark:text-success-400" />
                </div>
              )}
              <p className="text-sm font-bold text-foreground">{formatPrice(product.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
