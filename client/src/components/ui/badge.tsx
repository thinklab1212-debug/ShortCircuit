import { cn } from '@/lib/utils'

// ─── Badge Component ────────────────────────────────────────────────────────────

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info'
  | 'gradient'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  removable?: boolean
  onRemove?: () => void
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-foreground text-background shadow-sm',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm',
  outline: 'border border-border text-foreground bg-transparent',
  success: 'bg-success-50 text-success-700 border border-success-200 dark:bg-success-950/50 dark:text-success-400 dark:border-success-800',
  warning: 'bg-warning-50 text-warning-700 border border-warning-200 dark:bg-warning-950/50 dark:text-warning-400 dark:border-warning-800',
  info: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700',
  gradient: 'bg-slate-900 text-white shadow-sm',
}

const sizeStyles: Record<string, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot,
  removable,
  onRemove,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn(
          'h-1.5 w-1.5 rounded-full',
          variant === 'success' && 'bg-success-500',
          variant === 'warning' && 'bg-warning-500',
          variant === 'destructive' && 'bg-error-500',
          variant === 'info' && 'bg-slate-500',
          variant === 'default' && 'bg-primary-foreground',
          variant === 'secondary' && 'bg-secondary-foreground',
          variant === 'outline' && 'bg-foreground',
          variant === 'gradient' && 'bg-white',
        )} />
      )}
      {children}
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 -mr-1 h-3.5 w-3.5 rounded-full inline-flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </div>
  )
}
