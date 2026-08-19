import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import type { ProductImage } from '@/types'

// ─── Product Gallery ────────────────────────────────────────────────────────────

interface ProductGalleryProps {
  images: ProductImage[]
  name: string
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const allImages = images.length > 0 ? images : [{ url: '/placeholder.png', publicId: '', alt: name }]
  const total = allImages.length

  const goNext = useCallback(() => setSelected((s) => (s + 1) % total), [total])
  const goPrev = useCallback(() => setSelected((s) => (s - 1 + total) % total), [total])

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxOpen, goNext, goPrev])

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [lightboxOpen])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div
          className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted/30 cursor-zoom-in"
          onMouseEnter={() => setZoomed(true)}
          onMouseLeave={() => setZoomed(false)}
          onMouseMove={handleMouseMove}
          onClick={() => setLightboxOpen(true)}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={selected}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              src={allImages[selected].url}
              alt={allImages[selected].alt || name}
              className="h-full w-full object-contain"
              fetchPriority={selected === 0 ? "high" : "auto"}
              loading={selected === 0 ? "eager" : "lazy"}
              style={
                zoomed
                  ? {
                      transform: 'scale(2)',
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transition: 'transform-origin 0.1s ease',
                    }
                  : undefined
              }
            />
          </AnimatePresence>

          {/* Image Counter Badge */}
          {total > 1 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white pointer-events-none">
              {selected + 1} / {total}
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(true) }}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/70"
            aria-label="View fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {/* Arrow Navigation */}
          {total > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-lg text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-background hover:scale-110"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-lg text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-background hover:scale-110"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {total > 1 && (
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {allImages.map((img, i) => (
              <button
                key={img.publicId || i}
                onClick={() => setSelected(i)}
                className={cn(
                  'relative shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-muted/30 transition-all duration-200',
                  i === selected
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md scale-[1.02]'
                    : 'border border-border/60 hover:border-primary/40 hover:shadow-sm opacity-70 hover:opacity-100'
                )}
              >
                <img
                  src={img.url}
                  alt={img.alt || `${name} ${i + 1}`}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Fullscreen Lightbox ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Counter */}
            {total > 1 && (
              <div className="absolute top-5 left-1/2 -translate-x-1/2 text-sm font-medium text-white/80 z-10">
                {selected + 1} of {total}
              </div>
            )}

            {/* Image */}
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[85vh] max-w-[90vw] flex items-center justify-center"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selected}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  src={allImages[selected].url}
                  alt={allImages[selected].alt || name}
                  className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg select-none"
                  draggable={false}
                />
              </AnimatePresence>
            </motion.div>

            {/* Navigation Arrows */}
            {total > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev() }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-110 z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext() }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-110 z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Thumbnail strip in lightbox */}
            {total > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {allImages.map((img, i) => (
                  <button
                    key={img.publicId || i}
                    onClick={(e) => { e.stopPropagation(); setSelected(i) }}
                    className={cn(
                      'h-14 w-14 rounded-lg overflow-hidden transition-all duration-200 border-2',
                      i === selected
                        ? 'border-white shadow-lg scale-110'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    )}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || `${name} ${i + 1}`}
                      className="h-full w-full object-contain bg-white/10"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
