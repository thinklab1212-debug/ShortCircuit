import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Shop Pagination ────────────────────────────────────────────────────────────

interface ShopPaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  className?: string
}

export default function ShopPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  className,
}: ShopPaginationProps) {
  if (totalPages <= 1) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  const pages = generatePages(page, totalPages)

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-6 sm:pt-8 w-full', className)}>
      <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
        Showing <span className="font-medium text-foreground">{start}–{end}</span> of{' '}
        <span className="font-medium text-foreground">{total.toLocaleString()}</span>
      </p>

      <div className="flex items-center justify-center gap-1 sm:gap-1.5 max-w-full overflow-x-auto py-1 px-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 sm:h-9 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors inline-flex items-center gap-1 shrink-0"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden xs:inline sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="w-6 sm:w-8 text-center text-xs sm:text-sm text-muted-foreground">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={cn(
                  'h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 flex items-center justify-center',
                  p === page
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'border border-border bg-background hover:bg-muted'
                )}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 sm:h-9 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors inline-flex items-center gap-1 shrink-0"
          aria-label="Next page"
        >
          <span className="hidden xs:inline sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function generatePages(current: number, total: number): (number | string)[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, 4, '...', total]
  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

