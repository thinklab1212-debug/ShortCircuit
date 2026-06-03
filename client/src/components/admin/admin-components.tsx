import { cn } from '@/lib/utils'

// ─── Admin Chart Card ───────────────────────────────────────────────────────────

interface ChartCardProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, subtitle, action, children, className }: ChartCardProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-6', className)}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ─── Admin Page Header ──────────────────────────────────────────────────────────

interface AdminPageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function AdminPageHeader({ title, description, action, className }: AdminPageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Admin Section ──────────────────────────────────────────────────────────────

interface AdminSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function AdminSection({ title, description, children, className }: AdminSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || description) && (
        <div>
          {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

// ─── Admin Status Indicator ─────────────────────────────────────────────────────

interface StatusIndicatorProps {
  status: 'active' | 'inactive' | 'pending' | 'error'
  label?: string
}

const statusStyles = {
  active: { dot: 'bg-success-500', text: 'text-success-700 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-950/50' },
  inactive: { dot: 'bg-neutral-400', text: 'text-neutral-600 dark:text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800/50' },
  pending: { dot: 'bg-warning-500 animate-pulse', text: 'text-warning-700 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-950/50' },
  error: { dot: 'bg-error-500', text: 'text-error-700 dark:text-error-400', bg: 'bg-error-50 dark:bg-error-950/50' },
}

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  error: 'Error',
}

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const styles = statusStyles[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', styles.bg, styles.text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} />
      {label || statusLabels[status]}
    </span>
  )
}
