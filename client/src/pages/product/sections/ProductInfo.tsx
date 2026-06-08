import { Link } from 'react-router'
import { Star, Shield, Truck, BadgeCheck, CreditCard, Headset } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductBadge } from '@/components/ui/product-badge'
import { formatPrice, effectivePrice, productDiscount } from '@/utils'
import type { Product } from '@/types'

// ─── Product Info ───────────────────────────────────────────────────────────────

interface ProductInfoProps {
  product: Product
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const discount = productDiscount(product)
  const price = effectivePrice(product)
  const hasDiscount = product.salePrice != null && product.salePrice < product.price
  const brand = typeof product.brand === 'object' ? product.brand : null
  const category = typeof product.category === 'object' ? product.category : null

  return (
    <div className="space-y-5">
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

      {/* Rating */}
      {product.ratingsCount > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-success-50 dark:bg-success-950/50 px-2.5 py-1">
            <span className="text-sm font-bold text-success-700 dark:text-success-400">
              {product.ratingsAverage.toFixed(1)}
            </span>
            <Star className="h-3.5 w-3.5 fill-success-600 text-success-600 dark:fill-success-400 dark:text-success-400" />
          </div>
          <span className="text-sm text-muted-foreground">
            {product.ratingsCount} {product.ratingsCount === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      )}

      {/* Price */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl font-bold text-foreground">
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="text-lg text-muted-foreground line-through">
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

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-3 text-sm">
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
        <div>
          <span className="text-muted-foreground">Availability: </span>
          <span className={cn('font-medium', product.stock > 0 ? 'text-success-600' : 'text-error-500')}>
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
        {product.soldCount > 0 && (
          <div>
            <span className="text-muted-foreground">Sold: </span>
            <span className="font-medium text-foreground">{product.soldCount}+ units</span>
          </div>
        )}
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        {[
          { icon: BadgeCheck, label: 'Genuine Components' },
          { icon: Shield, label: 'Tested Quality' },
          { icon: Truck, label: 'Fast Shipping' },
          { icon: CreditCard, label: 'Secure Payments' },
          { icon: Headset, label: 'Technical Support' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-2.5 py-2 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5 text-primary" />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
