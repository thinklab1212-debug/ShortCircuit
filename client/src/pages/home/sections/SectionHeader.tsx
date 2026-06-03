import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'

// ─── Reusable Section Header ────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
  subtitle?: string
  link?: string
  linkText?: string
}

export function SectionHeader({ title, subtitle, link, linkText = 'View All' }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <h2 className="text-display-xs sm:text-display-sm font-heading text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-body-md text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {link && (
        <Link
          to={link}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
        >
          {linkText}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
