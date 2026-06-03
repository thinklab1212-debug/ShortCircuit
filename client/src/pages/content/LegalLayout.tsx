import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { fadeInUp } from '@/config/animations'

interface LegalLayoutProps {
  title: string
  updated?: string
  intro?: string
  children: ReactNode
}

/** Centered, readable layout shared by the legal / info content pages. */
export default function LegalLayout({ title, updated, intro, children }: LegalLayoutProps) {
  return (
    <div className="container py-6 lg:py-8">
      <Breadcrumb items={[{ label: title }]} className="mb-6" />

      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="mx-auto max-w-3xl"
      >
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="text-display-xs font-heading text-foreground sm:text-display-sm">{title}</h1>
          {updated && (
            <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
          )}
          {intro && <p className="mt-4 text-body-md leading-relaxed text-muted-foreground">{intro}</p>}
        </header>

        <div className="space-y-8">{children}</div>
      </motion.div>
    </div>
  )
}

interface LegalSectionProps {
  heading: string
  children: ReactNode
}

export function LegalSection({ heading, children }: LegalSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
      <div className="space-y-3 text-body-md leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}
