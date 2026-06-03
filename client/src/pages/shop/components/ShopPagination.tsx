import { cn } from '@/lib/utils'

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
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 pt-8', className)}>
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}–{end}</span> of{' '}
        <span className="font-medium text-foreground">{total.toLocaleString()}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-9 px-3 rounded-lg text-sm font-medium border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Previous
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="w-9 text-center text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                'h-9 w-9 rounded-lg text-sm font-medium transition-colors',
                p === page
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border bg-background hover:bg-muted'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-9 px-3 rounded-lg text-sm font-medium border border-border bg-background hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

function generatePages(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, 4, '...', total]
  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}
