import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { countUpVariants, fadeInUp } from '@/config/animations'
import type { LucideIcon } from 'lucide-react'

// ─── Stat Card ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: 'primary' | 'success' | 'warning' | 'error' | 'info'
  className?: string
}

const iconColorMap = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success-50 text-success-600 dark:bg-success-950/50 dark:text-success-400',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-950/50 dark:text-warning-400',
  error: 'bg-error-50 text-error-600 dark:bg-error-950/50 dark:text-error-400',
  info: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'primary',
  className,
}: StatCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className={cn(
        'rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-card-hover',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <motion.p
            variants={countUpVariants}
            className="text-3xl font-bold text-foreground font-heading tracking-tight"
          >
            {value}
          </motion.p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold',
                  change >= 0
                    ? 'bg-success-50 text-success-700 dark:bg-success-950/50 dark:text-success-400'
                    : 'bg-error-50 text-error-700 dark:bg-error-950/50 dark:text-error-400'
                )}
              >
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconColorMap[iconColor])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Mini Stat Card ─────────────────────────────────────────────────────────────

interface MiniStatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function MiniStatCard({ title, value, icon: Icon, trend, className }: MiniStatCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm',
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
      {trend && (
        <div className="ml-auto">
          <span
            className={cn(
              'text-xs font-medium',
              trend === 'up' && 'text-success-600',
              trend === 'down' && 'text-error-500',
              trend === 'neutral' && 'text-muted-foreground'
            )}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        </div>
      )}
    </div>
  )
}
