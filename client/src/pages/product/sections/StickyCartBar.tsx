import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice, effectivePrice, primaryImage } from '@/utils'
import type { Product } from '@/types'

// ─── Sticky Cart Bar ────────────────────────────────────────────────────────────
// Appears when the main AddToCart section scrolls out of view

interface StickyCartBarProps {
  product: Product
  onAddToCart: (productId: string, quantity: number) => void
  onBuyNow: (productId: string, quantity: number) => void
  isAddingToCart?: boolean
  /** ID of the container element to observe — when it leaves viewport, bar shows */
  targetRef: React.RefObject<HTMLDivElement | null>
}

export default function StickyCartBar({
  product,
  onAddToCart,
  onBuyNow,
  isAddingToCart = false,
  targetRef,
}: StickyCartBarProps) {
  const [visible, setVisible] = useState(false)
  const isOutOfStock = product.stock === 0
  const price = effectivePrice(product)
  const image = primaryImage(product)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when the AddToCart section is NOT visible
        setVisible(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [targetRef])

  return (
    <AnimatePresence>
      {visible && !isOutOfStock && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-bottom"
        >
          <div className="container flex items-center gap-4 py-3">
            {/* Product thumbnail + info */}
            <div className="hidden sm:flex items-center gap-3 min-w-0 flex-1">
              <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-border bg-muted/30">
                <img
                  src={image}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {product.name}
                </p>
                <p className="text-lg font-bold text-foreground">
                  {formatPrice(price)}
                </p>
              </div>
            </div>

            {/* Mobile: just price */}
            <div className="sm:hidden flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{product.name}</p>
              <p className="text-lg font-bold text-foreground">{formatPrice(price)}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="default"
                className="h-10 gap-2 px-4"
                loading={isAddingToCart}
                loadingText="Adding..."
                onClick={() => onAddToCart(product._id, 1)}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Add to Cart</span>
                <span className="sm:hidden">Cart</span>
              </Button>
              <Button
                size="default"
                variant="gradient"
                className="h-10 gap-2 px-4"
                onClick={() => onBuyNow(product._id, 1)}
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Buy Now</span>
                <span className="sm:hidden">Buy</span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
