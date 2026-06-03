import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fadeInUp, staggerContainer } from '@/config/animations'
import toast from 'react-hot-toast'

// ─── Newsletter Section ─────────────────────────────────────────────────────────

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
      toast.success('Subscribed successfully!')
    }, 1000)
  }

  return (
    <section className="py-16 lg:py-20">
      <div className="container">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12 sm:px-12 sm:py-16 lg:px-20"
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-400/8 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-slate-300/10 rounded-full translate-y-1/2 -translate-x-1/3" />

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <motion.div variants={fadeInUp} className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
              <Mail className="h-7 w-7 text-white" />
            </motion.div>

            <motion.h2 variants={fadeInUp} className="text-display-xs sm:text-display-sm font-heading text-white mb-3">
              Stay in the Loop
            </motion.h2>

            <motion.p variants={fadeInUp} className="text-body-md text-white/70 mb-8 max-w-md mx-auto">
              Get exclusive deals, early access to new products, and tech news delivered to your inbox.
            </motion.p>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-3 text-white"
              >
                <CheckCircle2 className="h-6 w-6 text-green-300" />
                <span className="text-lg font-medium">You're subscribed! Check your inbox.</span>
              </motion.div>
            ) : (
              <motion.form
                variants={fadeInUp}
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                />
                <Button
                  type="submit"
                  loading={isLoading}
                  loadingText="..."
                  size="lg"
                  className="h-12 bg-white text-slate-900 hover:bg-white/90 shrink-0 group"
                >
                  Subscribe
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.form>
            )}

            <motion.p variants={fadeInUp} className="mt-4 text-xs text-white/40">
              No spam, ever. Unsubscribe at any time.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
