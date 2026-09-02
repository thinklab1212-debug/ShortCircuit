import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PackageSearch, RefreshCw, Cpu, ShieldCheck, Truck, ArrowUp } from 'lucide-react'

import { Link } from 'react-router'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ProductGridCard } from '@/components/ui/product-card'
import { ProductListCard } from '@/components/ui/product-card'
import { Button } from '@/components/ui/button'
import { useShopFilters } from '@/hooks/useShopFilters'
import { useProducts } from '@/hooks/useProducts'
import { useCategories, useBrands } from '@/hooks/useHomeData'
import { useProductActions } from '@/hooks/useProductActions'
import { useDocumentMetadata } from '@/hooks'
import {
  FilterSidebar,
  ActiveFilterTags,
  SortControls,
  ShopSearch,
  MobileFilterDrawer,
  ShopPagination,
} from './components'
import ProductRequestCard from '@/components/common/ProductRequestCard'
import { staggerContainer, fadeInUp } from '@/config/animations'


// ─── Product Grid Skeleton ──────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="flex items-center gap-2">
          <div className="h-3 w-12 skeleton rounded" />
          <div className="h-3 w-8 skeleton rounded" />
        </div>
        <div className="h-5 w-20 skeleton rounded" />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="h-44 w-44 shrink-0 skeleton rounded-xl" />
      <div className="flex-1 space-y-3 py-2">
        <div className="h-3 w-20 skeleton rounded" />
        <div className="h-5 w-3/4 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-3 w-16 skeleton rounded" />
        <div className="h-6 w-24 skeleton rounded mt-auto" />
      </div>
    </div>
  )
}

// ─── Shop Page ──────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const { filters, setFilters, clearFilters, activeFilterCount } = useShopFilters()

  const { data, isLoading, isError, refetch, isFetching } = useProducts(filters)
  const { data: categories } = useCategories()
  const { data: brands } = useBrands()
  const { onAddToCart, onWishlistToggle, isInWishlist } = useProductActions()

  const products = data?.data || []
  const pagination = data?.pagination
  const isListView = filters.view === 'list'

  // Back to top button visibility
  const [showBackToTop, setShowBackToTop] = useState(false)
  useEffect(() => {
    const handler = () => setShowBackToTop(window.scrollY > 600)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Build JSON-LD structured data for CollectionPage, ItemList, and BreadcrumbList
  const jsonLdData = useMemo(() => {
    const itemListElements = products.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: p.name,
      url: `https://www.shortcircuit.co.in/product/${p.slug}`,
      image: p.images?.[0]?.url || '',
      offers: {
        '@type': 'Offer',
        price: p.salePrice || p.price,
        priceCurrency: 'INR',
        availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    }))

    return [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': 'https://www.shortcircuit.co.in/shop#collection',
        url: 'https://www.shortcircuit.co.in/shop',
        name: 'Electronics Components & Robotics Store — Short Circuit',
        description: 'Browse genuine microcontrollers, Arduino boards, Raspberry Pi, sensors, drone ESCs, motors, and robotics kits in India.',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: products.length,
          itemListElement: itemListElements,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
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
        ],
      },
    ]
  }, [products])

  // Dynamic document metadata for SEO
  useDocumentMetadata(
    filters.search
      ? `Search results for "${filters.search}"`
      : 'Buy Electronic Components, Sensors, Arduino & Robotics Parts',
    'Shop genuine electronic components in India at student-friendly prices. Explore Arduino, ESP32, Raspberry Pi, sensors, motors, drone parts, and DIY engineering kits with fast dispatch.',
    {
      keywords: [
        'buy electronic components India',
        'Arduino online store',
        'sensors for robotics',
        'Raspberry Pi boards',
        'ESP32 microcontroller',
        'drone motors and ESC',
        'engineering project components',
      ],
      canonical: 'https://www.shortcircuit.co.in/shop',
      type: 'website',
      jsonLd: jsonLdData,
    }
  )

  // Build breadcrumb
  const breadcrumbItems: { label: string; href?: string }[] = [{ label: 'Shop', href: '/shop' }]
  if (filters.search) {
    breadcrumbItems.push({ label: `Search: "${filters.search}"` })
  }

  return (
    <div className="overflow-x-clip">
      {/* ─── Gradient Hero Banner ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-48 bg-primary/10 rounded-full blur-[80px]" />

        <div className="container relative py-6 sm:py-14">
          <Breadcrumb items={breadcrumbItems} className="mb-5 [&_*]:text-white/60 [&_a]:hover:text-white/80" />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl"
          >
            <h1 className="text-display-xs sm:text-display-sm lg:text-display-md font-heading text-white leading-tight">
              {filters.search ? (
                <>Results for <span className="text-primary-foreground/80">"{filters.search}"</span></>
              ) : (
                <>Electronics Components <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Catalog</span></>
              )}
            </h1>
            <p className="mt-3 text-base text-white/60 max-w-lg leading-relaxed">
              Discover high-quality development boards, sensors, actuators, and robotics modules curated for students, engineers, and makers.
            </p>
          </motion.div>

          {/* Search Bar — integrated into hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-6 max-w-xl"
          >
            <ShopSearch
              value={filters.search || ''}
              onChange={(search) => setFilters({ search })}
              isSearching={isFetching && !isLoading}
            />
          </motion.div>
        </div>
      </div>

      {/* ─── Main Content ──────────────────────────────────────────────────────── */}
      <div className="container py-4 sm:py-6 lg:py-8">
        {/* Main Layout */}
        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-[260px] shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                filters={filters}
                onFilterChange={setFilters}
                onClear={clearFilters}
                activeCount={activeFilterCount}
              />
            </div>
          </div>

          {/* Product Area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar: Mobile Filter + Sort + View */}
            <SortControls
              filters={filters}
              onFilterChange={setFilters}
              total={pagination?.totalResults}
              mobileFilterTrigger={
                <MobileFilterDrawer
                  filters={filters}
                  onFilterChange={setFilters}
                  onClear={clearFilters}
                  activeCount={activeFilterCount}
                />
              }
            />

            {/* Active Filter Tags */}
            {activeFilterCount > 0 && (
              <div className="mb-4">
                <ActiveFilterTags
                  filters={filters}
                  onFilterChange={setFilters}
                  onClear={clearFilters}
                  categories={categories}
                  brands={brands}
                />
              </div>
            )}

            {/* Loading indicator for background refetch */}
            {isFetching && !isLoading && (
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Updating...
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className={
                isListView
                  ? 'space-y-4'
                  : 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6'
              }>
                {Array.from({ length: 6 }).map((_, i) =>
                  isListView ? <ListSkeleton key={i} /> : <ProductSkeleton key={i} />
                )}
              </div>
            )}

            {/* Error State */}
            {isError && !isLoading && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-50 dark:bg-error-950/50 mb-4">
                  <PackageSearch className="h-8 w-8 text-error-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Unable to load products</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Something went wrong while fetching products. Please try again.
                </p>
                <Button onClick={() => refetch()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && products.length === 0 && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-12 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <PackageSearch className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    {filters.search
                      ? `No components matched your search for "${filters.search}".`
                      : "Try adjusting your filters or search terms to find what you're looking for."}
                  </p>
                  {activeFilterCount > 0 && (
                    <Button onClick={clearFilters} variant="outline" size="sm">
                      Clear All Filters
                    </Button>
                  )}
                </div>

                {/* Product Request / Missing Product Card */}
                <ProductRequestCard searchTerm={filters.search || ''} />
              </div>
            )}


            {/* Product Grid */}
            {!isLoading && !isError && products.length > 0 && (
              <>
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  key={`${filters.page}-${filters.sort}-${filters.view}`}
                  className={
                    isListView
                      ? 'space-y-4'
                      : 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6'
                  }
                >
                  {products.map((product) => (
                    <motion.div key={product._id} variants={fadeInUp}>
                      {isListView ? (
                        <ProductListCard
                          product={product}
                          isWishlisted={isInWishlist(product._id)}
                          onAddToCart={onAddToCart}
                          onWishlistToggle={onWishlistToggle}
                        />
                      ) : (
                        <ProductGridCard
                          product={product}
                          isWishlisted={isInWishlist(product._id)}
                          onAddToCart={onAddToCart}
                          onWishlistToggle={onWishlistToggle}
                        />
                      )}
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {pagination && (
                  <ShopPagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.totalResults}
                    limit={pagination.limit}
                    onPageChange={(page) => setFilters({ page })}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Product Request Banner */}
        <div className="mt-8 sm:mt-14">
          <ProductRequestCard variant="banner" searchTerm={filters.search || ''} />
        </div>

        {/* ─── Rich SEO Information & Electronics Guide Section ────────────────────── */}
        <section className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-border space-y-6 sm:space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border hover:shadow-card-hover transition-shadow">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">100% Tested Hardware</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Every sensor, microcontroller, and IC is quality-verified before dispatch for reliable engineering projects.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border hover:shadow-card-hover transition-shadow">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Fast Dispatch Across India</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Same-day or next-day shipping to Delhi, Bengaluru, Mumbai, Pune, Hyderabad, Chennai, and all serviceable pincodes.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border hover:shadow-card-hover transition-shadow">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Student & Maker Friendly</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Affordable pricing on bulk college workshop orders, DIY kits, and individual lab components.
                </p>
              </div>
            </div>
          </div>

          {/* Informative Catalog Text & Category Links */}
          <div className="rounded-2xl bg-muted/40 border border-border p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 text-sm text-muted-foreground leading-relaxed">
            <div>
              <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground mb-2">
                Buy Genuine Electronic Components, Microcontrollers & DIY Kits Online in India
              </h2>
              <p>
                Welcome to Short Circuit, your one-stop electronics marketplace designed for students, makers, hobbyists, and professional engineers.
                Whether you are building your first line-following robot, prototyping an IoT sensor node with ESP32, or engineering an advanced autonomous drone,
                we supply top-tier hardware from trusted manufacturers at competitive prices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Microcontrollers</h4>
                <p className="text-xs">Arduino Uno, Mega, Nano, ESP32, ESP8266, Raspberry Pi Pico & development boards.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Sensors & Modules</h4>
                <p className="text-xs">Ultrasonic distance, IR, DHT11/22 temperature & humidity, MQ gas sensors, gyroscope & IMUs.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Motors & Drivers</h4>
                <p className="text-xs">L298N motor drivers, servo motors (SG90, MG996R), N20 micro gear motors, stepper drivers.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">DIY Project Kits</h4>
                <p className="text-xs">Explore step-by-step smart kits in our <Link to="/projects" className="text-primary underline">Project Builder</Link> with verified component lists.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ─── Back to Top Button ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors hover:scale-105 active:scale-95"
            aria-label="Back to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
