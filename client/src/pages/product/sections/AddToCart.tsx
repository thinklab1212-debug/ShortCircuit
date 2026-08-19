import { useState } from 'react'
import { ShoppingCart, Zap, Heart, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Product } from '@/types'

// ─── Add To Cart Section ────────────────────────────────────────────────────────

interface AddToCartProps {
  product: Product
  isWishlisted?: boolean
  onAddToCart?: (productId: string, quantity: number) => void
  onBuyNow?: (productId: string, quantity: number) => void
  onWishlistToggle?: (productId: string) => void
  isAddingToCart?: boolean
}

export default function AddToCart({
  product,
  isWishlisted = false,
  onAddToCart,
  onBuyNow,
  onWishlistToggle,
  isAddingToCart = false,
}: AddToCartProps) {
  const [quantity, setQuantity] = useState(1)
  const isOutOfStock = product.stock === 0
  const maxQty = Math.min(product.stock, 10)
  const isLowStock = product.stock > 0 && product.stock <= 10

  const increment = () => setQuantity((q) => Math.min(q + 1, maxQty))
  const decrement = () => setQuantity((q) => Math.max(q - 1, 1))

  // Calculate "sold" percentage for urgency bar (simulated from soldCount vs stock)
  const urgencyPercent = isLowStock
    ? Math.min(Math.round(((10 - product.stock) / 10) * 100), 95)
    : 0

  return (
    <div className="space-y-4">
      {/* Low Stock Urgency Bar */}
      {isLowStock && (
        <div className="space-y-2 rounded-xl bg-warning-50/60 dark:bg-warning-950/20 border border-warning-200/50 dark:border-warning-800/30 px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-warning-700 dark:text-warning-300">
              🔥 Selling fast — only {product.stock} left!
            </span>
            <span className="font-medium text-warning-600 dark:text-warning-400">
              {urgencyPercent}% claimed
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-warning-100 dark:bg-warning-900/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-warning-400 to-error-500 transition-all duration-700"
              style={{ width: `${urgencyPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      {!isOutOfStock && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Quantity</label>
          <div className="flex items-center gap-1.5">
            <div className="inline-flex items-center rounded-full border border-border bg-background overflow-hidden">
              <button
                onClick={decrement}
                disabled={quantity <= 1}
                className="flex h-10 w-10 items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex h-10 w-12 items-center justify-center text-sm font-semibold border-x border-border">
                {quantity}
              </div>
              <button
                onClick={increment}
                disabled={quantity >= maxQty}
                className="flex h-10 w-10 items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          className="flex-1 h-12 gap-2"
          disabled={isOutOfStock}
          loading={isAddingToCart}
          loadingText="Adding..."
          onClick={() => onAddToCart?.(product._id, quantity)}
        >
          <ShoppingCart className="h-4.5 w-4.5" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
        <Button
          size="lg"
          variant="gradient"
          className="flex-1 h-12 gap-2"
          disabled={isOutOfStock}
          onClick={() => onBuyNow?.(product._id, quantity)}
        >
          <Zap className="h-4.5 w-4.5" />
          Buy Now
        </Button>
      </div>

      {/* Wishlist */}
      <Button
        variant="outline"
        size="lg"
        className="w-full h-11 gap-2"
        onClick={() => onWishlistToggle?.(product._id)}
      >
        <Heart className={cn('h-4 w-4 transition-all', isWishlisted && 'fill-error-500 text-error-500 scale-110')} />
        {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      </Button>
    </div>
  )
}
