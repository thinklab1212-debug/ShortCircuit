import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fadeInUp } from '@/config/animations'

// ─── Promotional Banners ────────────────────────────────────────────────────────

export default function PromoBanners() {
  return (
    <section className="py-16 lg:py-20">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Banner — Flash Sale */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 lg:p-10 min-h-[280px] flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                <Zap className="h-3.5 w-3.5" />
                Flash Deals
              </div>
              <h3 className="text-display-xs sm:text-display-sm font-heading text-white">
                Lightning Deals<br />Every Hour
              </h3>
              <p className="text-body-md text-white/70 max-w-sm">
                Don't miss out on hourly rotating deals with up to 60% off on premium electronics.
              </p>
            </div>
            <div className="relative z-10 mt-6">
              <Button asChild className="bg-white text-slate-900 hover:bg-white/90 group">
                <Link to="/deals">
                  Shop Deals
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Right Banner — Student Discount */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-8 lg:p-10 min-h-[280px] flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                <Percent className="h-3.5 w-3.5" />
                Student Offer
              </div>
              <h3 className="text-display-xs sm:text-display-sm font-heading text-white">
                Extra 10% Off<br />For Students
              </h3>
              <p className="text-body-md text-white/70 max-w-sm">
                Verify your student status and unlock exclusive discounts on laptops, tablets & more.
              </p>
            </div>
            <div className="relative z-10 mt-6">
              <Button asChild className="bg-white text-slate-900 hover:bg-white/90 group">
                <Link to="/shop?tag=student">
                  Explore Offers
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
