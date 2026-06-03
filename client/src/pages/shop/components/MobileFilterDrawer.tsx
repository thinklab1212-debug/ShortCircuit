import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FilterSidebar from './FilterSidebar'
import { slideInLeft, modalOverlayVariants } from '@/config/animations'
import type { ShopFilters } from '@/hooks/useShopFilters'

// ─── Mobile Filter Drawer ───────────────────────────────────────────────────────

interface MobileFilterDrawerProps {
  filters: ShopFilters
  onFilterChange: (updates: Partial<ShopFilters>) => void
  onClear: () => void
  activeCount: number
}

export default function MobileFilterDrawer({
  filters,
  onFilterChange,
  onClear,
  activeCount,
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="lg:hidden gap-2"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </Button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              variants={modalOverlayVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            />

            {/* Panel */}
            <motion.div
              variants={slideInLeft}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-y-0 left-0 z-50 w-[320px] max-w-[85vw] bg-background border-r border-border shadow-xl overflow-y-auto lg:hidden"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-5 py-4">
                <h2 className="text-lg font-semibold font-heading">Filters</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Filter Content */}
              <div className="px-5 py-6">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={(updates) => {
                    onFilterChange(updates)
                  }}
                  onClear={() => {
                    onClear()
                    setOpen(false)
                  }}
                  activeCount={activeCount}
                />
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 border-t border-border bg-background px-5 py-4">
                <Button onClick={() => setOpen(false)} className="w-full">
                  Show Results
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
