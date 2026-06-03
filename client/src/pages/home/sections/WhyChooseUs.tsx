import { motion } from 'framer-motion'
import { Truck, ShieldCheck, GraduationCap, CreditCard, Headset, RotateCcw } from 'lucide-react'
import { staggerContainer, fadeInUp } from '@/config/animations'

// ─── Features ───────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Free shipping on orders above ₹999. Same-day delivery in select cities.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: ShieldCheck,
    title: 'Genuine Products',
    description: '100% authentic electronics sourced directly from authorized distributors.',
    color: 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-900/40',
  },
  {
    icon: GraduationCap,
    title: 'Student-Friendly',
    description: 'Special pricing and EMI options designed for students and young professionals.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'Multiple payment options including UPI, cards, and net banking. 100% secure.',
    color: 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-900/40',
  },
  {
    icon: Headset,
    title: '24/7 Support',
    description: 'Round-the-clock customer support via chat, email, and phone.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '7-day hassle-free return and replacement policy on all products.',
    color: 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-900/40',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="py-16 lg:py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-display-xs sm:text-display-sm font-heading text-foreground">
            Why Choose Short Circuit?
          </h2>
          <p className="mt-2 text-body-md text-muted-foreground max-w-2xl mx-auto">
            We're committed to providing the best electronics shopping experience in India.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-4 transition-transform group-hover:scale-110`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
