import { cn } from '@/lib/utils'

// ─── Price Display Component ────────────────────────────────────────────────────

interface PriceDisplayProps {
  price: number
  mrp?: number
  discount?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const priceSize = {
  sm: 'text-sm font-semibold',
  md: 'text-lg font-bold',
  lg: 'text-2xl font-bold',
}

const mrpSize = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

export function PriceDisplay({ price, mrp, discount, size = 'md', className }: PriceDisplayProps) {
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)

  const formattedMrp = mrp
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(mrp)
    : null

  const discountPercent = discount ?? (mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0)

  return (
    <div className={cn('flex items-baseline gap-2 flex-wrap', className)}>
      <span className={cn(priceSize[size], 'text-foreground')}>{formattedPrice}</span>
      {formattedMrp && mrp && mrp > price && (
        <span className={cn(mrpSize[size], 'text-muted-foreground line-through')}>
          {formattedMrp}
        </span>
      )}
      {discountPercent > 0 && (
        <span className={cn(mrpSize[size], 'font-semibold text-emerald-600 dark:text-emerald-400')}>
          {discountPercent}% off
        </span>
      )}
    </div>
  )
}
