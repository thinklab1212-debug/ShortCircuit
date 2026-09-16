import { cn } from '@/lib/utils'
import { ArrowDownUp, LayoutGrid, List, Boxes } from 'lucide-react'
import { Select } from '@/components/ui/select'
import type { ShopFilters } from '@/hooks/useShopFilters'

// ─── Sort Options ───────────────────────────────────────────────────────────────

const sortOptions = [
  { value: '-price', label: 'Price: High → Low' },
  { value: 'price', label: 'Price: Low → High' },
  { value: '-createdAt', label: 'Newest First' },
  { value: '-ratingsAverage', label: 'Highest Rated' },
  { value: '-sold', label: 'Best Selling' },
  { value: 'name', label: 'Name: A → Z' },
]

// ─── Sort & View Controls ───────────────────────────────────────────────────────

interface SortControlsProps {
  filters: ShopFilters
  onFilterChange: (updates: Partial<ShopFilters>) => void
  total?: number
  className?: string
  mobileFilterTrigger?: React.ReactNode
  onOpenBulkOrder?: () => void
}

export default function SortControls({
  filters,
  onFilterChange,
  total,
  className,
  mobileFilterTrigger,
  onOpenBulkOrder,
}: SortControlsProps) {
  return (
    <div className={cn('space-y-2.5 mb-4', className)}>
      {/* Top row: Results count + Desktop Sort/View */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {total !== undefined ? (
            <>
              Showing <span className="font-bold text-foreground tabular-nums">{total.toLocaleString()}</span> products
            </>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-12 skeleton rounded" />
            </span>
          )}
        </p>

        {/* Desktop Controls (hidden on mobile, shown on lg screens) */}
        <div className="hidden lg:flex items-center gap-3">
          {onOpenBulkOrder && (
            <button
              type="button"
              onClick={onOpenBulkOrder}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-colors cursor-pointer"
              title="Request bulk discount quotation for multiple components"
            >
              <Boxes className="h-3.5 w-3.5" />
              <span>Bulk Order / RFQ</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filters.sort || '-price'}
              onChange={(e) => onFilterChange({ sort: e.target.value })}
              className="h-9 text-sm w-auto min-w-[170px]"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/30">
            <button
              onClick={() => onFilterChange({ view: 'grid' })}
              className={cn(
                'flex items-center justify-center h-8 w-8 rounded-md transition-all duration-200',
                filters.view === 'grid'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onFilterChange({ view: 'list' })}
              className={cn(
                'flex items-center justify-center h-8 w-8 rounded-md transition-all duration-200',
                filters.view === 'list'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Controls: 2-column grid with Filters & Sort dropdown side-by-side */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:hidden">
        {mobileFilterTrigger}
        <Select
          value={filters.sort || '-price'}
          onChange={(e) => onFilterChange({ sort: e.target.value })}
          className="h-10 text-xs sm:text-sm w-full rounded-xl"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Mobile Bulk Order button */}
      {onOpenBulkOrder && (
        <button
          type="button"
          onClick={onOpenBulkOrder}
          className="flex lg:hidden items-center justify-center gap-1.5 w-full h-8 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/25 rounded-lg transition-colors cursor-pointer"
        >
          <Boxes className="h-3.5 w-3.5" />
          <span>Ordering in Bulk? Request Quotation</span>
        </button>
      )}
    </div>
  )
}
