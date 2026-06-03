import { cn } from '@/lib/utils'
import { ArrowDownUp, LayoutGrid, List } from 'lucide-react'
import { Select } from '@/components/ui/select'
import type { ShopFilters } from '@/hooks/useShopFilters'

// ─── Sort Options ───────────────────────────────────────────────────────────────

const sortOptions = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price', label: 'Price: Low → High' },
  { value: '-price', label: 'Price: High → Low' },
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
}

export default function SortControls({ filters, onFilterChange, total, className }: SortControlsProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      {/* Result count */}
      <p className="text-sm text-muted-foreground">
        {total !== undefined ? (
          <>
            <span className="font-medium text-foreground">{total.toLocaleString()}</span> products found
          </>
        ) : (
          'Loading...'
        )}
      </p>

      <div className="flex items-center gap-3">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowDownUp className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <Select
            value={filters.sort || '-createdAt'}
            onChange={(e) => onFilterChange({ sort: e.target.value })}
            className="h-9 text-sm w-auto min-w-[160px]"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* View Toggle */}
        <div className="hidden sm:flex items-center border border-border rounded-lg p-0.5">
          <button
            onClick={() => onFilterChange({ view: 'grid' })}
            className={cn(
              'flex items-center justify-center h-8 w-8 rounded-md transition-colors',
              filters.view === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onFilterChange({ view: 'list' })}
            className={cn(
              'flex items-center justify-center h-8 w-8 rounded-md transition-colors',
              filters.view === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
