import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Cpu, Truck, ShieldCheck, Headphones, Zap, ArrowRight } from 'lucide-react'
import { useCategories } from '@/hooks'
import { Button } from '@/components/ui/button'
import { staggerContainer, fadeInUp } from '@/config/animations'

const STATS = [
  { value: '50,000+', label: 'Products in stock' },
  { value: '1.2M+', label: 'Orders delivered' },
  { value: '300+', label: 'Partner brands' },
  { value: '4.7/5', label: 'Customer rating' },
]

const WHY = [
  {
    icon: Cpu,
    title: 'Built for engineers',
    desc: 'Datasheets, specs and compatibility info on every product so you order the right part the first time.',
  },
  {
    icon: Truck,
    title: 'Fast nationwide delivery',
    desc: 'Same-day dispatch on in-stock items, with delivery to campuses and labs across India.',
  },
  {
    icon: ShieldCheck,
    title: 'Genuine & warrantied',
    desc: 'Every component is sourced from authorised distributors and backed by manufacturer warranty.',
  },
  {
    icon: Headphones,
    title: 'Real human support',
    desc: 'Our team of makers helps you pick parts, track orders and resolve issues quickly.',
  },
]

const FALLBACK_CATEGORIES = ['Microcontrollers', 'Sensors', 'Development Boards', 'Power Supplies', 'Tools', 'Components']

export default function AboutPage() {
  const { data: categories } = useCategories()
  const categoryNames =
    categories && categories.length > 0
      ? categories.slice(0, 6).map((c) => c.name)
      : FALLBACK_CATEGORIES

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-br from-slate-50 to-card dark:from-slate-900/40">
        <div className="container py-16 lg:py-24">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              Powering the next generation of makers
            </div>
            <h1 className="text-display-sm font-heading text-foreground sm:text-display-md">
              The electronics marketplace built for engineering students
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-body-lg leading-relaxed text-muted-foreground">
              Short Circuit brings together the components, boards and tools you need for
              coursework, capstone projects and side builds — all in one place, at student-friendly prices.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container">
        {/* Mission */}
        <section className="py-14 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-display-xs font-heading text-foreground">Our mission</h2>
            <p className="mt-4 text-body-lg leading-relaxed text-muted-foreground">
              We believe that getting your hands on quality electronics shouldn't be hard or
              expensive. Our mission is to make every component — from a single resistor to a
              full development kit — easy to find, fairly priced and quick to deliver, so you
              can spend less time sourcing and more time building.
            </p>
          </div>
        </section>

        {/* What we sell */}
        <section className="py-8">
          <h2 className="text-center text-display-xs font-heading text-foreground">What we sell</h2>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-50px' }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            {categoryNames.map((name) => (
              <motion.span
                key={name}
                variants={fadeInUp}
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground"
              >
                {name}
              </motion.span>
            ))}
          </motion.div>
        </section>

        {/* Stats */}
        <section className="py-14 lg:py-20">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                variants={fadeInUp}
                className="rounded-2xl border border-border bg-card p-6 text-center"
              >
                <p className="text-display-xs font-heading text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Why choose us */}
        <section className="py-8">
          <h2 className="text-center text-display-xs font-heading text-foreground">Why choose Short Circuit</h2>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-50px' }}
            className="mt-8 grid gap-5 sm:grid-cols-2"
          >
            {WHY.map((item) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  variants={fadeInUp}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </section>

        {/* CTA */}
        <section className="py-14 lg:py-20">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-12 text-center text-white lg:px-16 lg:py-16"
          >
            <h2 className="text-display-xs font-heading">Ready to start building?</h2>
            <p className="mx-auto mt-3 max-w-xl text-body-md text-white/90">
              Browse thousands of components and kits, with everything you need for your next project.
            </p>
            <Button asChild size="xl" variant="secondary" className="mt-7">
              <Link to="/shop">
                Explore the shop
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
