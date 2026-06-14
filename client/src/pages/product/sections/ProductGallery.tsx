import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
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

  const allImages = images.length > 0 ? images : [{ url: '/placeholder.png', publicId: '', alt: name }]

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted/30 cursor-zoom-in"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={selected}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
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
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {allImages.map((img, i) => (
            <button
              key={img.publicId || i}
              onClick={() => setSelected(i)}
              className={cn(
                'relative shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-xl border-2 overflow-hidden bg-muted/30 transition-all',
                i === selected
                  ? 'border-primary shadow-sm'
                  : 'border-transparent hover:border-border'
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
  )
}
