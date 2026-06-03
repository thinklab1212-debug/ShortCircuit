import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fadeInUp, staggerContainer } from '@/config/animations'

// ─── Footer CTA ─────────────────────────────────────────────────────────────────

export default function FooterCTA() {
  return (
    <section className="py-16 lg:py-20 bg-muted/30">
      <div className="container">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-6">
            <Zap className="h-7 w-7 text-primary" />
          </motion.div>

          <motion.h2 variants={fadeInUp} className="text-display-sm sm:text-display-md font-heading text-foreground mb-4">
            Ready to upgrade your tech?
          </motion.h2>

          <motion.p variants={fadeInUp} className="text-body-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of happy customers who trust Short Circuit for their electronics needs.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <Button asChild size="xl" variant="gradient" className="group">
              <Link to="/shop">
                Start Shopping
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link to="/register">Create Account</Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-8 mt-12 text-muted-foreground">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground font-heading">50K+</div>
              <div className="text-xs">Happy Customers</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground font-heading">10K+</div>
              <div className="text-xs">Products</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground font-heading">500+</div>
              <div className="text-xs">Brands</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground font-heading">4.8★</div>
              <div className="text-xs">Avg Rating</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
