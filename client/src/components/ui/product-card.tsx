import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Eye, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice, effectivePrice, productDiscount, primaryImage } from '@/utils'
import { ProductBadge } from '@/components/ui/product-badge'
import { productCardVariants } from '@/config/animations'
import type { Product } from '@/types'

// ─── Product Grid Card ──────────────────────────────────────────────────────────

interface ProductGridCardProps {
  product: Product
  isWishlisted?: boolean
  onWishlistToggle?: (productId: string) => void
  onAddToCart?: (productId: string) => void
  onQuickView?: (product: Product) => void
  className?: string
}

export function ProductGridCard({
  product,
  isWishlisted = false,
  onWishlistToggle,
  onAddToCart,
  onQuickView,
  className,
}: ProductGridCardProps) {
  const price = effectivePrice(product)
  const discount = productDiscount(product)
  const hasDiscount = product.salePrice != null && product.salePrice < product.price
  const isOutOfStock = product.stock === 0
  const brandName = typeof product.brand === 'object' && product.brand ? product.brand.name : null

  return (
    <motion.div
      variants={productCardVariants}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300',
        'hover:shadow-card-hover hover:-translate-y-1',
        isOutOfStock && 'opacity-75',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <Link to={`/product/${product.slug}`}>
          <motion.img
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.3 }}
            src={primaryImage(product)}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500"
            loading="lazy"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && <ProductBadge variant="sale">-{discount}%</ProductBadge>}
          {product.isFeatured && <ProductBadge variant="new">Featured</ProductBadge>}
          {isOutOfStock && <ProductBadge variant="out-of-stock">Out of Stock</ProductBadge>}
          {product.stock > 0 && product.stock <= 5 && (
            <ProductBadge variant="limited">Only {product.stock} left</ProductBadge>
          )}
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/10 group-hover:opacity-100">
          {onQuickView && (
            <button
              onClick={() => onQuickView(product)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {onAddToCart && !isOutOfStock && (
            <button
              onClick={() => onAddToCart(product._id)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Wishlist Button */}
        {onWishlistToggle && (
          <button
            onClick={() => onWishlistToggle(product._id)}
            className={cn(
              'absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200',
              isWishlisted
                ? 'bg-error-500 text-white shadow-md'
                : 'bg-background/80 text-muted-foreground backdrop-blur-sm hover:bg-background hover:text-error-500 shadow-sm'
            )}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Brand */}
        {brandName && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {brandName}
          </p>
        )}

        {/* Name */}
        <Link to={`/product/${product.slug}`} className="group/name">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover/name:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.ratingsCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 rounded bg-success-50 dark:bg-success-950/50 px-1.5 py-0.5">
              <span className="text-xs font-bold text-success-700 dark:text-success-400">
                {product.ratingsAverage.toFixed(1)}
              </span>
              <Star className="h-3 w-3 fill-success-600 text-success-600 dark:fill-success-400 dark:text-success-400" />
            </div>
            <span className="text-xs text-muted-foreground">({product.ratingsCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-lg font-bold text-foreground">{formatPrice(price)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>
          )}
          {discount > 0 && (
            <span className="text-xs font-semibold text-success-600 dark:text-success-400">
              {discount}% off
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Product List Card ──────────────────────────────────────────────────────────

interface ProductListCardProps {
  product: Product
  isWishlisted?: boolean
  onWishlistToggle?: (productId: string) => void
  onAddToCart?: (productId: string) => void
  className?: string
}

export function ProductListCard({
  product,
  isWishlisted = false,
  onWishlistToggle,
  onAddToCart,
  className,
}: ProductListCardProps) {
  const price = effectivePrice(product)
  const discount = productDiscount(product)
  const hasDiscount = product.salePrice != null && product.salePrice < product.price
  const isOutOfStock = product.stock === 0
  const brandName = typeof product.brand === 'object' && product.brand ? product.brand.name : null

  return (
    <motion.div
      variants={productCardVariants}
      className={cn(
        'group flex flex-col sm:flex-row gap-4 rounded-2xl border border-border bg-card p-4 transition-all duration-300',
        'hover:shadow-card-hover',
        isOutOfStock && 'opacity-75',
        className
      )}
    >
      {/* Image */}
      <Link to={`/product/${product.slug}`} className="relative shrink-0 overflow-hidden rounded-xl">
        <div className="h-40 w-full sm:h-44 sm:w-44 overflow-hidden rounded-xl bg-muted/30">
          <img
            src={primaryImage(product)}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && <ProductBadge variant="sale" size="sm">-{discount}%</ProductBadge>}
          {isOutOfStock && <ProductBadge variant="out-of-stock" size="sm">Out of Stock</ProductBadge>}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div>
          {brandName && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {brandName}
            </p>
          )}
          <Link to={`/product/${product.slug}`}>
            <h3 className="text-base font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.shortDescription && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {product.shortDescription}
            </p>
          )}

          {/* Rating */}
          {product.ratingsCount > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex items-center gap-0.5 rounded bg-success-50 dark:bg-success-950/50 px-1.5 py-0.5">
                <span className="text-xs font-bold text-success-700 dark:text-success-400">
                  {product.ratingsAverage.toFixed(1)}
                </span>
                <Star className="h-3 w-3 fill-success-600 text-success-600 dark:fill-success-400 dark:text-success-400" />
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.ratingsCount} reviews)
              </span>
            </div>
          )}
        </div>

        {/* Bottom: Price + Actions */}
        <div className="flex items-center justify-between gap-4 mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">{formatPrice(price)}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onWishlistToggle && (
              <button
                onClick={() => onWishlistToggle(product._id)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                  isWishlisted
                    ? 'border-error-500 bg-error-50 text-error-500 dark:bg-error-950/50'
                    : 'border-border text-muted-foreground hover:border-error-300 hover:text-error-500'
                )}
                aria-label="Toggle wishlist"
              >
                <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
              </button>
            )}
            {onAddToCart && !isOutOfStock && (
              <button
                onClick={() => onAddToCart(product._id)}
                className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97]"
              >
                <ShoppingCart className="h-4 w-4" />
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Product Quick View Card ────────────────────────────────────────────────────

interface ProductQuickViewProps {
  product: Product
  isWishlisted?: boolean
  onWishlistToggle?: (productId: string) => void
  onAddToCart?: (productId: string) => void
  onClose?: () => void
}

export function ProductQuickView({
  product,
  isWishlisted = false,
  onWishlistToggle,
  onAddToCart,
  onClose,
}: ProductQuickViewProps) {
  const price = effectivePrice(product)
  const discount = productDiscount(product)
  const hasDiscount = product.salePrice != null && product.salePrice < product.price
  const brandName = typeof product.brand === 'object' && product.brand ? product.brand.name : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* Image Gallery */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted/30">
        <img src={primaryImage(product)} alt={product.name} className="h-full w-full object-cover" />
        {discount > 0 && (
          <div className="absolute top-4 left-4">
            <ProductBadge variant="sale">-{discount}%</ProductBadge>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-4">
        {brandName && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {brandName}
          </p>
        )}

        <h2 className="text-2xl font-bold font-heading text-foreground">{product.name}</h2>

        {/* Rating */}
        {product.ratingsCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md bg-success-50 dark:bg-success-950/50 px-2 py-1">
              <span className="text-sm font-bold text-success-700 dark:text-success-400">
                {product.ratingsAverage.toFixed(1)}
              </span>
              <Star className="h-3.5 w-3.5 fill-success-600 text-success-600 dark:fill-success-400 dark:text-success-400" />
            </div>
            <span className="text-sm text-muted-foreground">{product.ratingsCount} reviews</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-foreground">{formatPrice(price)}</span>
          {hasDiscount && (
            <>
              <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
              <span className="text-sm font-semibold text-success-600 dark:text-success-400">
                {discount}% off
              </span>
            </>
          )}
        </div>

        {/* Description */}
        {product.shortDescription && (
          <p className="text-sm text-muted-foreground leading-relaxed">{product.shortDescription}</p>
        )}

        {/* Stock Status */}
        <div className="flex items-center gap-2">
          {product.stock > 0 ? (
            <span className="text-sm text-success-600 dark:text-success-400 font-medium">✓ In Stock</span>
          ) : (
            <span className="text-sm text-error-500 font-medium">✕ Out of Stock</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-auto pt-4">
          {onAddToCart && product.stock > 0 && (
            <button
              onClick={() => onAddToCart(product._id)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary h-12 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
          )}
          {onWishlistToggle && (
            <button
              onClick={() => onWishlistToggle(product._id)}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all',
                isWishlisted
                  ? 'border-error-500 bg-error-50 text-error-500 dark:bg-error-950/50'
                  : 'border-border text-muted-foreground hover:border-error-300 hover:text-error-500'
              )}
              aria-label="Toggle wishlist"
            >
              <Heart className={cn('h-5 w-5', isWishlisted && 'fill-current')} />
            </button>
          )}
        </div>

        {/* View Full Details */}
        <Link
          to={`/product/${product.slug}`}
          onClick={onClose}
          className="text-center text-sm font-medium text-primary hover:underline"
        >
          View Full Details →
        </Link>
      </div>
    </div>
  )
}
