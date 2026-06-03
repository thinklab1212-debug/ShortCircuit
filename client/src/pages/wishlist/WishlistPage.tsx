import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Heart, LogIn, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductGridCard } from '@/components/ui/product-card'
import { useWishlist, useRemoveFromWishlist, useAddToCart } from '@/hooks'
import { useAuthStore } from '@/store'
import { staggerContainer, fadeInUp } from '@/config/animations'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function WishlistSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-square skeleton" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-16 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-5 w-20 skeleton rounded" />
      </div>
    </div>
  )
}

// ─── Wishlist Page ────────────────────────────────────────────────────────────

export default function WishlistPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: wishlist, isLoading } = useWishlist()
  const removeFromWishlist = useRemoveFromWishlist()
  const addToCart = useAddToCart()

  // ── Auth guard ──
  if (!isAuthenticated) {
    return (
      <div className="container py-16">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-xl font-semibold text-foreground">
            Sign in to view your wishlist
          </h1>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Save your favourite products and find them here whenever you log in.
          </p>
          <Button asChild>
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const products = wishlist?.products ?? []
  const isEmpty = !isLoading && products.length === 0

  return (
    <div className="container py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-display-xs sm:text-display-sm font-heading text-foreground">
          My Wishlist
        </h1>
        {!isLoading && products.length > 0 && (
          <p className="mt-1 text-body-md text-muted-foreground">
            {products.length} saved item(s)
          </p>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <WishlistSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {isEmpty && (
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Your wishlist is empty</h2>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Tap the heart on any product to save it here for later.
          </p>
          <Button asChild>
            <Link to="/shop">
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Grid */}
      {!isLoading && products.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {products.map((product) => (
            <motion.div key={product._id} variants={fadeInUp}>
              <ProductGridCard
                product={product}
                isWishlisted
                onWishlistToggle={(productId) => removeFromWishlist.mutate(productId)}
                onAddToCart={(productId) => addToCart.mutate({ productId, quantity: 1 })}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
