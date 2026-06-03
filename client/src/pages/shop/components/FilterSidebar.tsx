import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, X, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useCategories, useBrands } from '@/hooks/useHomeData'
import type { ShopFilters } from '@/hooks/useShopFilters'

// ─── Filter Sidebar ─────────────────────────────────────────────────────────────

interface FilterSidebarProps {
  filters: ShopFilters
  onFilterChange: (updates: Partial<ShopFilters>) => void
  onClear: () => void
  activeCount: number
  className?: string
}

export default function FilterSidebar({
  filters,
  onFilterChange,
  onClear,
  activeCount,
  className,
}: FilterSidebarProps) {
  const { data: categories, isLoading: catLoading } = useCategories()
  const { data: brands, isLoading: brandLoading } = useBrands()

  // Local price range state
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() || '')
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() || '')

  // Sync local state when URL changes
  useEffect(() => {
    setMinPrice(filters.minPrice?.toString() || '')
    setMaxPrice(filters.maxPrice?.toString() || '')
  }, [filters.minPrice, filters.maxPrice])

  const applyPrice = () => {
    onFilterChange({
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    })
  }

  return (
    <aside className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground font-heading">Filters</h3>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-xs gap-1.5 h-8">
            <RotateCcw className="h-3 w-3" />
            Clear all ({activeCount})
          </Button>
        )}
      </div>

      {/* Categories */}
      <FilterSection title="Category" loading={catLoading}>
        {categories?.filter((c) => c.isActive).map((cat) => (
          <button
            key={cat._id}
            onClick={() =>
              onFilterChange({
                category: filters.category === cat._id ? undefined : cat._id,
              })
            }
            className={cn(
              'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors',
              filters.category === cat._id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground hover:bg-muted'
            )}
          >
            <span className="truncate">{cat.name}</span>
            {cat.productCount !== undefined && (
              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                ({cat.productCount})
              </span>
            )}
          </button>
        ))}
      </FilterSection>

      {/* Brands */}
      <FilterSection title="Brand" loading={brandLoading}>
        {brands?.filter((b) => b.isActive).map((brand) => (
          <button
            key={brand._id}
            onClick={() =>
              onFilterChange({
                brand: filters.brand === brand._id ? undefined : brand._id,
              })
            }
            className={cn(
              'flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors',
              filters.brand === brand._id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground hover:bg-muted'
            )}
          >
            <span className="truncate">{brand.name}</span>
            {brand.productCount !== undefined && (
              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                ({brand.productCount})
              </span>
            )}
          </button>
        ))}
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            className="h-9 text-sm"
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            className="h-9 text-sm"
          />
        </div>
        {/* Quick price ranges */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            { label: 'Under ₹1K', min: 0, max: 999 },
            { label: '₹1K–5K', min: 1000, max: 5000 },
            { label: '₹5K–15K', min: 5000, max: 15000 },
            { label: '₹15K–50K', min: 15000, max: 50000 },
            { label: '₹50K+', min: 50000, max: undefined },
          ].map((range) => (
            <button
              key={range.label}
              onClick={() => onFilterChange({ minPrice: range.min, maxPrice: range.max })}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                filters.minPrice === range.min && filters.maxPrice === range.max
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Ratings */}
      <FilterSection title="Rating">
        {[4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() =>
              onFilterChange({
                rating: filters.rating === rating ? undefined : rating,
              })
            }
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors',
              filters.rating === rating
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground hover:bg-muted'
            )}
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3.5 w-3.5',
                    i < rating
                      ? 'fill-warning-400 text-warning-400'
                      : 'fill-none text-muted-foreground/30'
                  )}
                />
              ))}
            </div>
            <span>& up</span>
          </button>
        ))}
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability">
        <Checkbox
          label="In Stock only"
          checked={filters.inStock === true}
          onChange={() => onFilterChange({ inStock: filters.inStock ? undefined : true })}
        />
        <Checkbox
          label="Featured products"
          checked={filters.isFeatured === true}
          onChange={() => onFilterChange({ isFeatured: filters.isFeatured ? undefined : true })}
          className="mt-2"
        />
      </FilterSection>
    </aside>
  )
}

// ─── Filter Section Wrapper ─────────────────────────────────────────────────────

function FilterSection({
  title,
  loading,
  children,
}: {
  title: string
  loading?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 skeleton rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-0.5">{children}</div>
      )}
    </div>
  )
}

// ─── Active Filter Tags ─────────────────────────────────────────────────────────

interface ActiveFilterTagsProps {
  filters: ShopFilters
  onFilterChange: (updates: Partial<ShopFilters>) => void
  onClear: () => void
  categories?: { _id: string; name: string }[]
  brands?: { _id: string; name: string }[]
}

export function ActiveFilterTags({ filters, onFilterChange, onClear, categories, brands }: ActiveFilterTagsProps) {
  const tags: { key: string; label: string; onRemove: () => void }[] = []

  if (filters.search) {
    tags.push({
      key: 'search',
      label: `"${filters.search}"`,
      onRemove: () => onFilterChange({ search: undefined }),
    })
  }
  if (filters.category) {
    const cat = categories?.find((c) => c._id === filters.category)
    tags.push({
      key: 'category',
      label: cat?.name || 'Category',
      onRemove: () => onFilterChange({ category: undefined }),
    })
  }
  if (filters.brand) {
    const brand = brands?.find((b) => b._id === filters.brand)
    tags.push({
      key: 'brand',
      label: brand?.name || 'Brand',
      onRemove: () => onFilterChange({ brand: undefined }),
    })
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const label = filters.minPrice && filters.maxPrice
      ? `₹${filters.minPrice}–₹${filters.maxPrice}`
      : filters.minPrice
        ? `₹${filters.minPrice}+`
        : `Up to ₹${filters.maxPrice}`
    tags.push({
      key: 'price',
      label,
      onRemove: () => onFilterChange({ minPrice: undefined, maxPrice: undefined }),
    })
  }
  if (filters.rating !== undefined) {
    tags.push({
      key: 'rating',
      label: `${filters.rating}★ & up`,
      onRemove: () => onFilterChange({ rating: undefined }),
    })
  }
  if (filters.inStock) {
    tags.push({
      key: 'inStock',
      label: 'In Stock',
      onRemove: () => onFilterChange({ inStock: undefined }),
    })
  }
  if (filters.isFeatured) {
    tags.push({
      key: 'featured',
      label: 'Featured',
      onRemove: () => onFilterChange({ isFeatured: undefined }),
    })
  }

  if (tags.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2"
    >
      {tags.map((tag) => (
        <span
          key={tag.key}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
        >
          {tag.label}
          <button
            onClick={tag.onRemove}
            className="hover:text-primary/70 transition-colors"
            aria-label={`Remove ${tag.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClear}
        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Clear all
      </button>
    </motion.div>
  )
}
