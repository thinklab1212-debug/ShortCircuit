import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { LayoutGrid, Cpu, PackageSearch } from 'lucide-react'
import { useCategories } from '@/hooks'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { EmptyState } from '@/components/ui/error'
import { staggerContainer, fadeInUp } from '@/config/animations'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6">
      <div className="h-14 w-14 skeleton rounded-xl" />
      <div className="h-4 w-20 skeleton rounded" />
      <div className="h-3 w-14 skeleton rounded" />
    </div>
  )
}

// ─── Categories Page ────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories()

  return (
    <div className="container py-6 lg:py-8">
      <Breadcrumb items={[{ label: 'Categories' }]} className="mb-6" />

      {/* Hero Header */}
      <div className="mb-8 rounded-3xl border border-border bg-gradient-to-br from-slate-50 to-card p-8 dark:from-slate-900/40 lg:p-12">
        <div className="flex items-center gap-3 text-primary">
          <LayoutGrid className="h-6 w-6" />
          <span className="text-sm font-semibold uppercase tracking-wider">Browse</span>
        </div>
        <h1 className="mt-3 text-display-xs font-heading text-foreground sm:text-display-sm">
          Shop by Category
        </h1>
        <p className="mt-2 max-w-xl text-body-md text-muted-foreground">
          Explore our full range of electronics and components, neatly organised so you
          can find exactly what your next project needs.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && (!categories || categories.length === 0) && (
        <EmptyState
          icon={<PackageSearch className="h-8 w-8 text-muted-foreground" />}
          title="No categories yet"
          description="Categories will appear here once they are added to the store."
        />
      )}

      {/* Grid */}
      {!isLoading && categories && categories.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {categories.map((cat) => (
            <motion.div key={cat._id} variants={fadeInUp}>
              <Link
                to={`/category/${cat.slug}`}
                className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover"
              >
                {cat.image?.url ? (
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-muted">
                    <img src={cat.image.url} alt={cat.name} className="h-full w-full object-cover" />
                  </div>
                ) : cat.icon ? (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-3xl transition-colors group-hover:bg-primary/20">
                    <span aria-hidden>{cat.icon}</span>
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Cpu className="h-6 w-6" />
                  </div>
                )}
                <span className="line-clamp-1 text-sm font-medium text-foreground">{cat.name}</span>
                {cat.productCount !== undefined && (
                  <span className="text-xs text-muted-foreground">{cat.productCount} products</span>
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
