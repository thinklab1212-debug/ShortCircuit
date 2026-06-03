import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStarRating } from '@/utils'

// ─── Star Rating Component ──────────────────────────────────────────────────────

interface StarRatingProps {
  rating: number
  count?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  className?: string
}

const sizeStyles = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function StarRating({ rating, count, size = 'md', showCount = true, className }: StarRatingProps) {
  const stars = getStarRating(rating)

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {stars.map((star, i) => {
          if (star === 'full') {
            return (
              <Star
                key={i}
                className={cn(sizeStyles[size], 'fill-amber-400 text-amber-400')}
              />
            )
          }
          if (star === 'half') {
            return (
              <StarHalf
                key={i}
                className={cn(sizeStyles[size], 'fill-amber-400 text-amber-400')}
              />
            )
          }
          return (
            <Star
              key={i}
              className={cn(sizeStyles[size], 'text-muted-foreground/30')}
            />
          )
        })}
      </div>
      {showCount && count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  )
}
