import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Award, PackageSearch } from 'lucide-react'
import { useBrands } from '@/hooks'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { EmptyState } from '@/components/ui/error'
import { staggerContainer, fadeInUp } from '@/config/animations'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BrandSkeleton() {
  return (
    <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6">
      <div className="h-8 w-24 skeleton rounded" />
      <div className="h-3 w-14 skeleton rounded" />
    </div>
  )
}

// ─── Brands Page ────────────────────────────────────────────────────────────────

export default function BrandsPage() {
  const { data: brands, isLoading } = useBrands()

  return (
    <div className="container py-6 lg:py-8">
      <Breadcrumb items={[{ label: 'Brands' }]} className="mb-6" />

      {/* Hero Header */}
      <div className="mb-8 rounded-3xl border border-border bg-gradient-to-br from-slate-50 to-card p-8 dark:from-slate-900/40 lg:p-12">
        <div className="flex items-center gap-3 text-primary">
          <Award className="h-6 w-6" />
          <span className="text-sm font-semibold uppercase tracking-wider">Trusted by makers</span>
        </div>
        <h1 className="mt-3 text-display-xs font-heading text-foreground sm:text-display-sm">
          Shop by Brand
        </h1>
        <p className="mt-2 max-w-xl text-body-md text-muted-foreground">
          From global semiconductor giants to specialist component makers — browse products
          from the brands engineers rely on.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <BrandSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && (!brands || brands.length === 0) && (
        <EmptyState
          icon={<PackageSearch className="h-8 w-8 text-muted-foreground" />}
          title="No brands yet"
          description="Brands will appear here once they are added to the store."
        />
      )}

      {/* Grid */}
      {!isLoading && brands && brands.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {brands.map((brand) => (
            <motion.div key={brand._id} variants={fadeInUp}>
              <Link
                to={`/brand/${brand.slug}`}
                className="group flex h-32 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover"
              >
                {brand.logo?.url ? (
                  <img
                    src={brand.logo.url}
                    alt={brand.name}
                    className="h-10 max-w-[100px] object-contain opacity-70 transition-opacity group-hover:opacity-100"
                  />
                ) : (
                  <span className="text-lg font-bold font-heading text-muted-foreground transition-colors group-hover:text-foreground">
                    {brand.name}
                  </span>
                )}
                {brand.productCount !== undefined && (
                  <span className="text-xs text-muted-foreground">{brand.productCount} products</span>
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
