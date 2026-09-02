import { useMemo, useRef, useCallback, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowLeft, RefreshCw, PackageX } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { useProductBySlug } from '@/hooks/useProductDetail'
import { useTrackView } from '@/hooks/useRecentlyViewed'
import { useAddToCart, useToggleWishlist, useDocumentMetadata } from '@/hooks'
import { useAuthStore, useWishlistStore } from '@/store'
import type { LinkedProductVariant } from '@/types'
import {
  ProductGallery,
  ProductInfo,
  AddToCart,
  ProductVariantSelector,
  ProductTabs,
  ReviewsSection,
  RelatedProducts,
  RecentlyViewedProducts,
  DeliveryChecker,
  StickyCartBar,
} from './sections'
import { fadeInUp, staggerContainer } from '@/config/animations'
import toast from 'react-hot-toast'

// ─── Product Detail Skeleton ────────────────────────────────────────────────────

function ProductDetailSkeleton() {
  return (
    <div className="container py-4 sm:py-6 lg:py-8 space-y-8 sm:space-y-10">
      <div className="h-4 w-48 skeleton rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
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
  const addToCartRef = useRef<HTMLDivElement>(null)
  const reviewsRef = useRef<HTMLDivElement>(null)

  // Build JSON-LD structured data for Product & BreadcrumbList
  const jsonLdData = useMemo(() => {
    if (!product) return undefined

    const categoryObj = typeof product.category === 'object' ? product.category : null
    const brandObj = typeof product.brand === 'object' ? product.brand : null

    const breadcrumbList = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.shortcircuit.co.in',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: 'https://www.shortcircuit.co.in/shop',
      },
    ]

    if (categoryObj) {
      breadcrumbList.push({
        '@type': 'ListItem',
        position: 3,
        name: categoryObj.name,
        item: `https://www.shortcircuit.co.in/category/${categoryObj.slug}`,
      })
      breadcrumbList.push({
        '@type': 'ListItem',
        position: 4,
        name: product.name,
        item: `https://www.shortcircuit.co.in/product/${product.slug}`,
      })
    } else {
      breadcrumbList.push({
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `https://www.shortcircuit.co.in/product/${product.slug}`,
      })
    }

    const schema: Record<string, unknown>[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `https://www.shortcircuit.co.in/product/${product.slug}#product`,
        name: product.name,
        description: product.shortDescription || product.description,
        image: product.images?.map((img) => img.url) || [],
        sku: product.sku,
        brand: {
          '@type': 'Brand',
          name: brandObj?.name || 'Short Circuit',
        },
        category: categoryObj?.name || 'Electronics',
        offers: {
          '@type': 'Offer',
          url: `https://www.shortcircuit.co.in/product/${product.slug}`,
          priceCurrency: 'INR',
          price: product.salePrice || product.price,
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: 'Short Circuit',
          },
        },
        ...(product.ratingsCount > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.ratingsAverage || 5,
            reviewCount: product.ratingsCount,
            bestRating: 5,
            worstRating: 1,
          },
        }),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbList,
      },
    ]

    return schema
  }, [product])


  // Dynamic document metadata for SEO
  useDocumentMetadata(
    product ? `${product.name} — Buy Online at Best Price` : '',
    product?.shortDescription || product?.description?.substring(0, 160) || 'Buy electronic components and robotics parts online at student-friendly prices in India.',
    {
      keywords: [
        product?.name,
        product?.sku,
        typeof product?.category === 'object' ? product?.category?.name : '',
        'buy electronic components online India',
        'sensors Arduino robotics',
      ].filter(Boolean) as string[],
      image: product?.images?.find((img) => img.isPrimary)?.url || product?.images?.[0]?.url,
      type: 'product',
      canonical: product ? `https://www.shortcircuit.co.in/product/${product.slug}` : undefined,
      jsonLd: jsonLdData,
    }
  )


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

  const [activeVariant, setActiveVariant] = useState<LinkedProductVariant | null>(null)

  const handleAddToCart = (productId: string, quantity: number, variantIdOverride?: string) => {
    if (!requireAuth()) return
    const targetVariantId = variantIdOverride ?? activeVariant?._id
    addToCart.mutate({ productId, quantity, variantId: targetVariantId })
  }
  const handleBuyNow = (productId: string, quantity: number, variantIdOverride?: string) => {
    if (!requireAuth()) return
    const targetVariantId = variantIdOverride ?? activeVariant?._id
    addToCart.mutate(
      { productId, quantity, variantId: targetVariantId },
      { onSuccess: () => navigate('/checkout') }
    )
  }
  const handleWishlistToggle = (productId: string) => {
    if (!requireAuth()) return
    toggleWishlist.mutate(productId)
  }

  const scrollToReviews = useCallback(() => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

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

  // Construct dynamic JSON-LD Product Schema
  const price = product ? (product.salePrice ?? product.price) : 0
  const brandName = product && typeof product.brand === 'object' && product.brand ? product.brand.name : 'Short Circuit'
  const categoryName = product && typeof product.category === 'object' && product.category ? product.category.name : ''
  const imagesArray = product?.images?.map((img) => img.url) || []

  const productSchema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'image': imagesArray.length > 0 ? imagesArray : ['/placeholder.png'],
    'description': product.shortDescription || product.description?.substring(0, 300),
    'sku': product.sku,
    'mpn': product.sku,
    'brand': {
      '@type': 'Brand',
      'name': brandName,
    },
    'category': categoryName,
    'offers': {
      '@type': 'Offer',
      'url': window.location.href,
      'priceCurrency': 'INR',
      'price': price,
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'priceValidUntil': '2030-12-31',
      'seller': {
        '@type': 'Organization',
        'name': 'Short Circuit',
      },
    },
    ...(product.ratingsCount > 0 ? {
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': product.ratingsAverage,
        'reviewCount': product.ratingsCount,
      },
    } : {}),
  } : null

  return (
    <>
      <div className="container py-4 sm:py-6 lg:py-8">
        {/* Dynamic SEO & Schema */}
        {productSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
          />
        )}

        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
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
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12"
        >
          {/* Left: Gallery */}
          <motion.div variants={fadeInUp}>
            <ProductGallery images={product.images} name={product.name} />
          </motion.div>

          {/* Right: Info + Actions */}
          <motion.div variants={fadeInUp} className="space-y-5 sm:space-y-8">
            <ProductInfo
              product={product}
              activeVariant={activeVariant}
              onScrollToReviews={scrollToReviews}
            />

            {/* Product Family Variant Selector */}
            {product.productType === 'family' && (
              <ProductVariantSelector
                product={product}
                onVariantSelect={setActiveVariant}
                onAddToCartVariant={(vId, qty) => handleAddToCart(product._id, qty, vId)}
              />
            )}

            <div ref={addToCartRef} className="border-t border-border pt-4 sm:pt-6">
              <AddToCart
                product={product}
                isWishlisted={isInWishlist(product._id)}
                isAddingToCart={addToCart.isPending}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onWishlistToggle={handleWishlistToggle}
              />
            </div>

            {/* Delivery Checker */}
            <div className="border-t border-border pt-4 sm:pt-6">
              <DeliveryChecker />
            </div>

          </motion.div>
        </motion.div>

        {/* ─── Tabbed Content: Description + Specifications + Package Contents ── */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mt-8 sm:mt-12"
        >
          <ProductTabs
            description={product.description}
            specifications={product.specifications || []}
            features={product.packageContents || []}
          />
        </motion.div>

        {/* Reviews */}
        <motion.div
          ref={reviewsRef}
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mt-8 sm:mt-12 border-t border-border pt-8 sm:pt-12 scroll-mt-24"
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
          className="mt-8 sm:mt-12 border-t border-border pt-8 sm:pt-12"
        >
          <RelatedProducts categoryId={categoryId} currentProductId={product._id} />
        </motion.div>

        {/* Recently Viewed */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mt-8 sm:mt-12 border-t border-border pt-8 sm:pt-12"
        >
          <RecentlyViewedProducts currentProductId={product._id} />
        </motion.div>
      </div>

      {/* Sticky Cart Bar — lives outside container for full-width positioning */}
      <StickyCartBar
        product={product}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isAddingToCart={addToCart.isPending}
        targetRef={addToCartRef}
      />
    </>
  )
}
