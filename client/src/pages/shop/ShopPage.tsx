import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { PackageSearch, RefreshCw, Cpu, ShieldCheck, Truck } from 'lucide-react'

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
    <div className="container py-6 lg:py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-display-xs sm:text-display-sm font-heading text-foreground">
          {filters.search ? `Results for "${filters.search}"` : 'Electronics Components Catalog'}
        </h1>
        <p className="mt-1 text-body-md text-muted-foreground">
          Discover high-quality development boards, sensors, actuators, and robotics modules curated for students, engineers, and makers.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <ShopSearch
          value={filters.search || ''}
          onChange={(search) => setFilters({ search })}
          className="max-w-lg"
        />
      </div>

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
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <MobileFilterDrawer
              filters={filters}
              onFilterChange={setFilters}
              onClear={clearFilters}
              activeCount={activeFilterCount}
            />
            <SortControls
              filters={filters}
              onFilterChange={setFilters}
              total={pagination?.totalResults}
              className="flex-1"
            />
          </div>

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
                : 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <PackageSearch className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Try adjusting your filters or search terms to find what you're looking for.
              </p>
              {activeFilterCount > 0 && (
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              )}
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
                    : 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'
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

      {/* ─── Rich SEO Information & Electronics Guide Section ────────────────────── */}
      <section className="mt-16 pt-12 border-t border-border space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border">
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

          <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border">
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

          <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border">
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
        <div className="rounded-2xl bg-muted/40 border border-border p-6 sm:p-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
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
  )
}

