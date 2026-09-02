import { useState } from 'react'
import { Link } from 'react-router'
import { Star, Shield, Truck, BadgeCheck, CreditCard, Headset, Share2, Link2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductBadge } from '@/components/ui/product-badge'
import { formatPrice, productDiscount } from '@/utils'
import type { Product, LinkedProductVariant } from '@/types'
import toast from 'react-hot-toast'

// ─── Product Info ───────────────────────────────────────────────────────────────

interface ProductInfoProps {
  product: Product
  activeVariant?: LinkedProductVariant | null
  onScrollToReviews?: () => void
}

export default function ProductInfo({ product, activeVariant, onScrollToReviews }: ProductInfoProps) {
  // Use active variant pricing if provided for Product Family
  const rawPrice = activeVariant ? activeVariant.price : product.price
  const rawSalePrice = activeVariant ? activeVariant.salePrice : product.salePrice
  const hasDiscount = rawSalePrice != null && rawSalePrice < rawPrice
  const price = rawSalePrice ?? rawPrice
  const discount = hasDiscount ? Math.round(((rawPrice - rawSalePrice!) / rawPrice) * 100) : productDiscount(product)
  const brand = typeof product.brand === 'object' ? product.brand : null
  const category = typeof product.category === 'object' ? product.category : null
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription || `Check out ${product.name}`,
          url: window.location.href,
        })
      } catch {
        // user cancelled share
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {discount > 0 && <ProductBadge variant="sale">-{discount}% OFF</ProductBadge>}
        {product.isFeatured && <ProductBadge variant="featured">Featured</ProductBadge>}
        {product.stock > 0 && product.stock <= 5 && (
          <ProductBadge variant="limited">Only {product.stock} left</ProductBadge>
        )}
        {product.stock === 0 && <ProductBadge variant="out-of-stock">Out of Stock</ProductBadge>}
      </div>

      {/* Brand */}
      {brand && (
        <Link
          to={`/brand/${brand.slug}`}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
        >
          {brand.name}
        </Link>
      )}

      {/* Name */}
      <h1 className="text-display-xs sm:text-display-sm font-heading text-foreground leading-tight">
        {product.name}
      </h1>

      {/* Rating — clickable to scroll to reviews */}
      {product.ratingsCount > 0 && (
        <button
          type="button"
          onClick={onScrollToReviews}
          className="flex items-center gap-3 group"
        >
          <div className="flex items-center gap-1 rounded-lg bg-success-50 dark:bg-success-950/50 px-2.5 py-1 transition-colors group-hover:bg-success-100 dark:group-hover:bg-success-950/70">
            <span className="text-sm font-bold text-success-700 dark:text-success-400">
              {product.ratingsAverage.toFixed(1)}
            </span>
            <Star className="h-3.5 w-3.5 fill-success-600 text-success-600 dark:fill-success-400 dark:text-success-400" />
          </div>
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors underline-offset-2 group-hover:underline">
            {product.ratingsCount} {product.ratingsCount === 1 ? 'review' : 'reviews'}
          </span>
        </button>
      )}

      {/* Price */}
      <div className="space-y-1.5">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="text-base sm:text-lg text-muted-foreground line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
        {hasDiscount && (
          <p className="text-sm font-medium text-success-600 dark:text-success-400">
            You save {formatPrice(product.price - price)} ({discount}% off)
          </p>
        )}
        <p className="text-xs text-muted-foreground">(Including all taxes)</p>
      </div>

      {/* Short Description */}
      {product.shortDescription && (
        <p className="text-body-md text-muted-foreground leading-relaxed">
          {product.shortDescription}
        </p>
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Stock Status + Share Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {product.stock > 0 ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success-500" />
              </span>
              <span className="text-sm font-medium text-success-600 dark:text-success-400">
                In Stock — dispatches in 24h
              </span>
            </>
          ) : (
            <>
              <span className="h-2.5 w-2.5 rounded-full bg-error-500" />
              <span className="text-sm font-medium text-error-500">
                Out of Stock
              </span>
            </>
          )}
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyLink}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            aria-label="Copy link"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success-500" /> : <Link2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            aria-label="Share product"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
        {category && (
          <div>
            <span className="text-muted-foreground">Category: </span>
            <Link to={`/category/${category.slug}`} className="font-medium text-foreground hover:text-primary transition-colors">
              {category.name}
            </Link>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">SKU: </span>
          <span className="font-medium text-foreground font-mono text-xs">{product.sku}</span>
        </div>
        {product.soldCount > 0 && (
          <div>
            <span className="text-muted-foreground">Sold: </span>
            <span className="font-medium text-foreground">{product.soldCount}+ units</span>
          </div>
        )}
      </div>

      {/* Trust Badges — Redesigned as gradient pills */}
      <div className="flex flex-wrap gap-2 pt-1">
        {[
          { icon: BadgeCheck, label: 'Genuine Components', color: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20' },
          { icon: Shield, label: 'Tested Quality', color: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20' },
          { icon: Truck, label: 'Fast Shipping', color: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20' },
          { icon: CreditCard, label: 'Secure Payments', color: 'from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20' },
          { icon: Headset, label: 'Tech Support', color: 'from-rose-500/10 to-pink-500/10 dark:from-rose-500/20 dark:to-pink-500/20' },
        ].map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className={cn(
              'flex items-center gap-1.5 rounded-full bg-gradient-to-r px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium text-foreground/80 transition-all hover:scale-[1.02]',
              color
            )}
          >
            <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
