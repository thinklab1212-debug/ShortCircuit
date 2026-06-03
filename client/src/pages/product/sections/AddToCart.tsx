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

  const increment = () => setQuantity((q) => Math.min(q + 1, maxQty))
  const decrement = () => setQuantity((q) => Math.max(q - 1, 1))

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      {!isOutOfStock && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Quantity</label>
          <div className="flex items-center gap-1">
            <button
              onClick={decrement}
              disabled={quantity <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-border bg-background text-sm font-semibold">
              {quantity}
            </div>
            <button
              onClick={increment}
              disabled={quantity >= maxQty}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
            {product.stock <= 10 && (
              <span className="ml-3 text-xs text-warning-600 dark:text-warning-400">
                Only {product.stock} left
              </span>
            )}
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
        <Heart className={cn('h-4 w-4', isWishlisted && 'fill-error-500 text-error-500')} />
        {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      </Button>
    </div>
  )
}
