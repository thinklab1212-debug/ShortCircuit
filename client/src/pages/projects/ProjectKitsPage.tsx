import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { Search, Cpu, Clock, Layers, ArrowRight, AlertCircle } from 'lucide-react'
import { useProjectKits } from '@/hooks/useProjectKits'
import { useDocumentMetadata } from '@/hooks/useDocumentMetadata'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PriceDisplay } from '@/components/ui/price-display'
import { staggerContainer, fadeInUp } from '@/config/animations'

// Difficulty color mapping
const difficultyVariants: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'destructive',
}

const APPLICATION_AREAS = [
  'IoT',
  'Robotics',
  'Drones',
  'Home Automation',
  'Wearables',
  'Industrial',
  'Education',
  'Prototyping',
  'Agriculture',
  'Healthcare',
  'Automotive',
  'Environmental Monitoring',
]

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

export default function ProjectKitsPage() {
  useDocumentMetadata(
    'Smart Project Builder — ElectroKart',
    'Browse our curated collection of engineering projects. View step-by-step guides, wiring diagrams, complete Bill of Materials (BOM), and buy the full kit with one click.'
  )

  // State filters
  const [search, setSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [page, setPage] = useState(1)

  // Fetch projects
  const { data, isLoading, isError, refetch } = useProjectKits({
    page,
    limit: 12,
    search: search || undefined,
    applicationArea: selectedArea || undefined,
    difficulty: selectedDifficulty || undefined,
  })

  const projects = data?.data || []
  const pagination = data?.pagination

  // Helper to calculate total project cost based on populated product prices
  const getBOMTotal = (components: any[]) => {
    return components.reduce((sum, comp) => {
      const product = comp.product
      if (!product) return sum
      const price = product.salePrice !== undefined ? product.salePrice : product.price
      return sum + (price || 0) * comp.quantity
    }, 0)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleAreaSelect = (area: string) => {
    setSelectedArea(area === selectedArea ? '' : area)
    setPage(1)
  }

  const handleDifficultySelect = (diff: string) => {
    setSelectedDifficulty(diff === selectedDifficulty ? '' : diff)
    setPage(1)
  }

  const handleClearFilters = () => {
    setSearch('')
    setSelectedArea('')
    setSelectedDifficulty('')
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="outline" className="mb-4 bg-primary/5 text-primary border-primary/20">
            ⚡ Smart Project Builder
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Engineering Project Kits
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore curated, student-friendly engineering and robotics projects. 
            Get complete wiring diagrams, build steps, and buy all parts in one click.
          </p>
        </div>

        {/* Filters and Search Bar Container */}
        <div className="glass-strong rounded-3xl p-6 mb-10 shadow-xl border border-border/60">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects by name, components, or tags..."
                value={search}
                onChange={handleSearchChange}
                className="pl-11 h-12 bg-background/50 border-border/80 focus:border-primary focus:ring-primary/20"
              />
            </div>
            {(selectedArea || selectedDifficulty || search) && (
              <Button onClick={handleClearFilters} variant="outline" className="h-12 px-6">
                Clear Filters
              </Button>
            )}
          </div>

          {/* Classification Filters */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Application Area
              </span>
              <div className="flex flex-wrap gap-2">
                {APPLICATION_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => handleAreaSelect(area)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                      selectedArea === area
                        ? 'bg-foreground text-background border-foreground shadow-md'
                        : 'bg-background hover:bg-muted border-border hover:border-border/80 text-foreground'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Difficulty Level
              </span>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff}
                    onClick={() => handleDifficultySelect(diff)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border capitalize transition-all duration-200 ${
                      selectedDifficulty === diff
                        ? 'bg-foreground text-background border-foreground shadow-md'
                        : 'bg-background hover:bg-muted border-border text-foreground'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Project Catalog Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="aspect-video skeleton-shimmer" />
                <div className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <div className="h-4 w-20 skeleton rounded" />
                    <div className="h-4 w-16 skeleton rounded" />
                  </div>
                  <div className="h-6 w-3/4 skeleton rounded" />
                  <div className="h-4 w-full skeleton rounded" />
                  <div className="h-4 w-5/6 skeleton rounded" />
                  <div className="h-8 w-full skeleton rounded pt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-border/80 bg-card/50">
            <AlertCircle className="h-12 w-12 text-destructive/80 mb-4 animate-bounce" />
            <h3 className="text-xl font-bold mb-2">Failed to load projects</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              We encountered an issue retrieving the project list. Please check your network and try again.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Retry Connection
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-border bg-card/50">
            <Cpu className="h-12 w-12 text-muted-foreground mb-4 opacity-60" />
            <h3 className="text-xl font-bold mb-2">No projects match criteria</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Try adjusting your search query or removing filters to discover our list of kits.
            </p>
            <Button onClick={handleClearFilters}>View All Projects</Button>
          </div>
        ) : (
          <>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {projects.map((project) => {
                const bomTotal = getBOMTotal(project.components)

                return (
                  <motion.div
                    key={project._id}
                    variants={fadeInUp}
                    className="group flex flex-col h-full rounded-3xl border border-border bg-card/40 hover:bg-card shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
                  >
                    {/* Project Cover Image */}
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img
                        src={project.coverImage.url}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge variant={difficultyVariants[project.difficulty] || 'default'} className="capitalize shadow">
                          {project.difficulty}
                        </Badge>
                        <Badge variant="secondary" className="shadow bg-background/80 backdrop-blur">
                          {project.applicationArea}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        {/* Meta time / comp */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 font-medium">
                          {project.estimatedTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {project.estimatedTime}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5" />
                            {project.totalComponents || project.components?.length || 0} Parts
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                          {project.shortDescription || project.description}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/60">
                        <div>
                          <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">
                            Estimated Kit Cost
                          </span>
                          {bomTotal > 0 ? (
                            <div className="text-lg font-extrabold text-foreground">
                              <PriceDisplay price={bomTotal} />
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-muted-foreground">Varies</span>
                          )}
                        </div>

                        <Button
                          asChild
                          variant="ghost"
                          className="group-hover:translate-x-1 transition-transform p-0 hover:bg-transparent hover:text-primary text-foreground font-semibold flex items-center gap-2"
                        >
                          <Link to={`/projects/${project.slug}`}>
                            Build Project
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                  className="rounded-xl"
                >
                  Prev
                </Button>
                <div className="text-sm text-muted-foreground px-4">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNextPage}
                  className="rounded-xl"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
