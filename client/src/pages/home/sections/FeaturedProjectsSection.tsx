import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Clock, Layers, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PriceDisplay } from '@/components/ui/price-display'

import { staggerContainer, fadeInUp } from '@/config/animations'
import { useFeaturedProjectKits } from '@/hooks/useProjectKits'
import { SectionHeader } from './SectionHeader'
import type { ProjectKit } from '@/types'

// ─── Difficulty Badge Colors ────────────────────────────────────────────────────

const difficultyVariants: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'destructive',
}

// ─── Project Card Skeleton ──────────────────────────────────────────────────────

function ProjectSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      <div className="aspect-video skeleton" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 skeleton rounded-full" />
          <div className="h-5 w-20 skeleton rounded-full" />
        </div>
        <div className="h-5 w-3/4 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-5/6 skeleton rounded" />
        <div className="flex justify-between items-center pt-3">
          <div className="h-5 w-20 skeleton rounded" />
          <div className="h-9 w-28 skeleton rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ─── BOM Price Helper ───────────────────────────────────────────────────────────

function getBOMTotal(components: ProjectKit['components']) {
  return components.reduce((sum, comp) => {
    const product = comp.product
    if (!product) return sum
    const price = product.salePrice !== undefined ? product.salePrice : product.price
    return sum + (price || 0) * comp.quantity
  }, 0)
}

// ─── Featured Projects Section ──────────────────────────────────────────────────

export default function FeaturedProjectsSection() {
  const { data: projects, isLoading, isError } = useFeaturedProjectKits()

  // Hide entire section when there are no featured projects (and not loading)
  if (!isLoading && (!projects || projects.length === 0)) return null
  if (isError) return null

  return (
    <section className="py-10 lg:py-20">
      <div className="container">
        <SectionHeader
          title="Featured Smart Projects"
          subtitle="Curated DIY engineering & robotics kits with complete step-by-step guides"
          link="/projects"
          linkText="Explore All Projects"
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProjectSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
          >
            {projects!.map((project) => {
              const bomTotal = getBOMTotal(project.components)

              return (
                <motion.div key={project._id} variants={fadeInUp}>
                  <Link
                    to={`/projects/${project.slug}`}
                    className="group flex flex-col h-full rounded-3xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1.5 hover:border-primary/20"
                  >
                    {/* Cover Image */}
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img
                        src={project.coverImage.url}
                        alt={project.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <Badge
                          variant={difficultyVariants[project.difficulty] || 'default'}
                          className="capitalize shadow-sm text-[10px] backdrop-blur-sm"
                        >
                          {project.difficulty}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="shadow-sm bg-background/80 backdrop-blur-sm text-[10px]"
                        >
                          {project.applicationArea}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col">
                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2.5 font-medium">
                        {project.estimatedTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {project.estimatedTime}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {project.totalComponents || project.components?.length || 0} Parts
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed flex-1">
                        {project.shortDescription || project.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/60">
                        <div>
                          <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">
                            Kit Cost
                          </span>
                          {bomTotal > 0 ? (
                            <div className="text-base font-extrabold text-foreground">
                              <PriceDisplay price={bomTotal} />
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-muted-foreground">Varies</span>
                          )}
                        </div>

                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                          Build Project
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </section>
  )
}
