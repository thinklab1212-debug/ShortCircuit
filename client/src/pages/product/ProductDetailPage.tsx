import { useParams, Link, useNavigate, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, RefreshCw, PackageX } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { useProductBySlug } from '@/hooks/useProductDetail'
import { useTrackView } from '@/hooks/useRecentlyViewed'
import { useAddToCart, useToggleWishlist } from '@/hooks'
import { useAuthStore, useWishlistStore } from '@/store'
import {
  ProductGallery,
  ProductInfo,
  AddToCart,
  Specifications,
  ReviewsSection,
  RelatedProducts,
  RecentlyViewedProducts,
} from './sections'
import { fadeInUp, staggerContainer } from '@/config/animations'
import toast from 'react-hot-toast'

// ─── Product Detail Skeleton ────────────────────────────────────────────────────

function ProductDetailSkeleton() {
  return (
    <div className="container py-6 lg:py-8 space-y-10">
      <div className="h-4 w-48 skeleton rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery skeleton */}
        <div className="space-y-4">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 w-20 skeleton rounded-xl shrink-0" />
            ))}
          </div>
        </div>
        {/* Info skeleton */}
        <div className="space-y-5">
          <div className="h-4 w-20 skeleton rounded" />
          <div className="h-8 w-3/4 skeleton rounded" />
          <div className="h-4 w-32 skeleton rounded" />
          <div className="h-10 w-40 skeleton rounded" />
          <div className="h-4 w-full skeleton rounded" />
          <div className="h-4 w-2/3 skeleton rounded" />
          <div className="h-12 w-full skeleton rounded-lg mt-6" />
          <div className="h-12 w-full skeleton rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// ─── Product Detail Page ────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: product, isLoading, isError, refetch } = useProductBySlug(slug || '')

  // Track recently viewed
  useTrackView(product)

  // Build breadcrumb
  const category = product && typeof product.category === 'object' ? product.category : null
  const breadcrumbItems: { label: string; href?: string }[] = []
  if (category) {
    breadcrumbItems.push({ label: category.name, href: `/category/${category.slug}` })
  }
  if (product) {
    breadcrumbItems.push({ label: product.name })
  }

  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isInWishlist = useWishlistStore((s) => s.isInWishlist)
  const addToCart = useAddToCart()
  const toggleWishlist = useToggleWishlist()

  const requireAuth = (): boolean => {
    if (!isAuthenticated) {
      toast.error('Please sign in to continue')
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
      return false
    }
    return true
  }

  const handleAddToCart = (productId: string, quantity: number) => {
    if (!requireAuth()) return
    addToCart.mutate({ productId, quantity })
  }
  const handleBuyNow = (productId: string, quantity: number) => {
    if (!requireAuth()) return
    addToCart.mutate(
      { productId, quantity },
      { onSuccess: () => navigate('/checkout') }
    )
  }
  const handleWishlistToggle = (productId: string) => {
    if (!requireAuth()) return
    toggleWishlist.mutate(productId)
  }

  // ── Loading ──
  if (isLoading) return <ProductDetailSkeleton />

  // ── Error ──
  if (isError || !product) {
    return (
      <div className="container py-16">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 px-6 text-center max-w-lg mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-50 dark:bg-error-950/50 mb-4">
            <PackageX className="h-8 w-8 text-error-500" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Product Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button asChild>
              <Link to="/shop">Browse Products</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const categoryId = typeof product.category === 'object' ? product.category._id : product.category

  return (
    <div className="container py-6 lg:py-8">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <Breadcrumb items={breadcrumbItems} />
        <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
          <Link to="/shop">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Shop
          </Link>
        </Button>
      </div>

      {/* Main Product Layout */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
      >
        {/* Left: Gallery */}
        <motion.div variants={fadeInUp}>
          <ProductGallery images={product.images} name={product.name} />
        </motion.div>

        {/* Right: Info + Actions */}
        <motion.div variants={fadeInUp} className="space-y-8">
          <ProductInfo product={product} />

          <div className="border-t border-border pt-6">
            <AddToCart
              product={product}
              isWishlisted={isInWishlist(product._id)}
              isAddingToCart={addToCart.isPending}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onWishlistToggle={handleWishlistToggle}
            />
          </div>


        </motion.div>
      </motion.div>

      {/* Product Description */}
      {product.description && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mt-12 space-y-4"
        >
          <h2 className="text-xl font-bold font-heading text-foreground">Description</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
            {product.description.split('\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Specifications */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="mt-12"
      >
        <Specifications
          specifications={product.specifications || []}
          features={product.packageContents || []}
        />
      </motion.div>

      {/* Reviews */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="mt-12 border-t border-border pt-12"
      >
        <ReviewsSection
          productId={product._id}
          ratingsAverage={product.ratingsAverage}
          ratingsQuantity={product.ratingsCount}
        />
      </motion.div>

      {/* Related Products */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="mt-12 border-t border-border pt-12"
      >
        <RelatedProducts categoryId={categoryId} currentProductId={product._id} />
      </motion.div>

      {/* Recently Viewed */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        className="mt-12 border-t border-border pt-12"
      >
        <RecentlyViewedProducts currentProductId={product._id} />
      </motion.div>
    </div>
  )
}
