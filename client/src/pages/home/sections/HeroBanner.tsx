import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useActiveBanners } from '@/hooks/useHomeData'

// ─── Fallback Banners ───────────────────────────────────────────────────────────

const fallbackBanners = [
  {
    _id: '1',
    title: 'Power Your Innovation',
    subtitle: 'High-quality development boards, microcontrollers, and electrical components for science projects, engineering research, and prototyping.',
    link: '/shop',
    gradient: 'from-slate-900 via-slate-800 to-slate-950',
  },
  {
    _id: '2',
    title: 'Academic & Research Gear',
    subtitle: 'Find specialized sensors, IoT modules, power supplies, and communication chips curated for thesis, lab tests, and academic prototypes.',
    link: '/shop',
    gradient: 'from-slate-900 via-slate-700 to-slate-900',
  },
  {
    _id: '3',
    title: 'Student Project Essentials',
    subtitle: 'Get Arduino boards, robotics components, breadboards, and drone electronics at student-friendly rates. Built for student innovators.',
    link: '/shop',
    gradient: 'from-zinc-950 via-slate-900 to-zinc-900',
  },
]

// ─── Hero Banner ────────────────────────────────────────────────────────────────

export default function HeroBanner() {
  const { data: banners } = useActiveBanners()
  const [current, setCurrent] = useState(0)

  const slides = banners && banners.length > 0 ? banners : null
  const items = slides || fallbackBanners
  const total = items.length

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total])

  // Auto-play
  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative h-[340px] sm:h-[480px] lg:h-[560px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            {slides ? (
              /* API banner with image */
              <div className="relative h-full w-full">
                {/* Mobile image (if provided) */}
                {slides[current].mobileImage?.url ? (
                  <>
                    <img
                      src={slides[current].mobileImage.url}
                      alt={slides[current].title}
                      className="h-full w-full object-cover sm:hidden"
                    />
                    <img
                      src={slides[current].image?.url}
                      alt={slides[current].title}
                      className="h-full w-full object-cover hidden sm:block"
                    />
                  </>
                ) : (
                  <img
                    src={slides[current].image?.url}
                    alt={slides[current].title}
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="container">
                    <div className="max-w-xl space-y-3 sm:space-y-6">
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="inline-flex items-center rounded-full bg-white/8 px-4 py-1.5 text-sm font-medium text-white/85 backdrop-blur-sm border border-white/20"
                      >
                        ⚡ Short Circuit Exclusive
                      </motion.div>
                      <motion.h2
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-display-sm sm:text-display-lg lg:text-display-xl font-heading text-white"
                      >
                        {slides[current].title}
                      </motion.h2>
                      {slides[current].subtitle && (
                        <motion.p
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.35, duration: 0.5 }}
                          className="text-body-sm sm:text-body-lg text-white/80 max-w-md line-clamp-2 sm:line-clamp-none"
                        >
                          {slides[current].subtitle}
                        </motion.p>
                      )}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="flex flex-wrap gap-3"
                      >
                        <Button asChild size="lg" className="group bg-white text-slate-900 hover:bg-white/90">
                          <Link to={slides[current].link || '/shop'}>
                            {slides[current].linkText || 'Shop Now'}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="border-white/35 bg-black/10 text-white hover:bg-white/10 hover:text-white">
                          <Link to="/categories">Browse Categories</Link>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Fallback gradient banner */
              <div className={`relative h-full w-full bg-gradient-to-br ${fallbackBanners[current].gradient}`}>
                <div className="absolute inset-0 bg-grid opacity-10" />
                <div className="absolute inset-0 bg-gradient-mesh" />
                <div className="absolute inset-0 flex items-center">
                  <div className="container">
                    <div className="max-w-xl space-y-3 sm:space-y-6">
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="inline-flex items-center rounded-full bg-white/8 px-4 py-1.5 text-sm font-medium text-white/85 backdrop-blur-sm border border-white/20"
                      >
                        ⚡ Short Circuit Exclusive
                      </motion.div>
                      <motion.h2
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-display-sm sm:text-display-lg lg:text-display-xl font-heading text-white"
                      >
                        {fallbackBanners[current].title}
                      </motion.h2>
                      <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.35, duration: 0.5 }}
                        className="text-body-sm sm:text-body-lg text-white/70 max-w-md line-clamp-2 sm:line-clamp-none"
                      >
                        {fallbackBanners[current].subtitle}
                      </motion.p>
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="flex flex-wrap gap-3"
                      >
                        <Button asChild size="lg" className="group bg-white text-slate-900 hover:bg-white/90">
                          <Link to={fallbackBanners[current].link}>
                            Shop Now
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="border-white/35 bg-black/10 text-white hover:bg-white/10 hover:text-white">
                          <Link to="/categories">Browse Categories</Link>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/20 transition-all hover:bg-white/20 hover:scale-110 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm border border-white/20 transition-all hover:bg-white/20 hover:scale-110 z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
