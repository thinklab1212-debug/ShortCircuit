import { cn } from '@/lib/utils'

// ─── Product Badge System ───────────────────────────────────────────────────────

type BadgeVariant = 'sale' | 'new' | 'best-seller' | 'out-of-stock' | 'limited' | 'trending' | 'featured'
type BadgeSize = 'sm' | 'md'

interface ProductBadgeProps {
  variant: BadgeVariant
  size?: BadgeSize
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  sale: 'bg-error-500 text-white shadow-sm',
  new: 'bg-slate-900 text-white shadow-sm',
  'best-seller': 'bg-warning-500 text-white shadow-sm',
  'out-of-stock': 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900',
  limited: 'bg-warning-100 text-warning-800 border border-warning-300 dark:bg-warning-900/30 dark:text-warning-300 dark:border-warning-700',
  trending: 'bg-primary text-primary-foreground shadow-sm',
  featured: 'bg-slate-700 text-white shadow-sm',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-1 text-xs',
}

export function ProductBadge({ variant, size = 'md', children, className }: ProductBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-bold uppercase tracking-wider leading-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  )
}
