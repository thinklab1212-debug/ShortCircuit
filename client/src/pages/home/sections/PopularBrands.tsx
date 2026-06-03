import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { useBrands } from '@/hooks/useHomeData'
import { staggerContainer, fadeInUp } from '@/config/animations'
import { SectionHeader } from './SectionHeader'

// ─── Popular Brands ─────────────────────────────────────────────────────────────

const fallbackBrands = [
  { name: 'Apple', slug: 'apple' },
  { name: 'Samsung', slug: 'samsung' },
  { name: 'Sony', slug: 'sony' },
  { name: 'OnePlus', slug: 'oneplus' },
  { name: 'Dell', slug: 'dell' },
  { name: 'HP', slug: 'hp' },
  { name: 'Lenovo', slug: 'lenovo' },
  { name: 'Bose', slug: 'bose' },
  { name: 'JBL', slug: 'jbl' },
  { name: 'Asus', slug: 'asus' },
]

export default function PopularBrands() {
  const { data: apiBrands } = useBrands()
  const brands = apiBrands && apiBrands.length > 0 ? apiBrands.slice(0, 10) : null

  return (
    <section className="py-16 lg:py-20">
      <div className="container">
        <SectionHeader
          title="Popular Brands"
          subtitle="Shop from top electronics brands"
          link="/brands"
          linkText="All Brands"
        />

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {brands
            ? brands.map((brand) => (
                <motion.div key={brand._id} variants={fadeInUp}>
                  <Link
                    to={`/brand/${brand.slug}`}
                    className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 h-32 transition-all duration-300 hover:shadow-card-hover hover:border-primary/30 hover:-translate-y-1"
                  >
                    {brand.logo?.url ? (
                      <img
                        src={brand.logo.url}
                        alt={brand.name}
                        className="h-10 max-w-[100px] object-contain opacity-70 transition-opacity group-hover:opacity-100"
                      />
                    ) : (
                      <span className="text-lg font-bold font-heading text-muted-foreground group-hover:text-foreground transition-colors">
                        {brand.name}
                      </span>
                    )}
                    {brand.productCount !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {brand.productCount} products
                      </span>
                    )}
                  </Link>
                </motion.div>
              ))
            : fallbackBrands.map((brand) => (
                <motion.div key={brand.slug} variants={fadeInUp}>
                  <Link
                    to={`/brand/${brand.slug}`}
                    className="group flex items-center justify-center rounded-2xl border border-border bg-card p-6 h-32 transition-all duration-300 hover:shadow-card-hover hover:border-primary/30 hover:-translate-y-1"
                  >
                    <span className="text-xl font-bold font-heading text-muted-foreground/60 group-hover:text-foreground transition-colors">
                      {brand.name}
                    </span>
                  </Link>
                </motion.div>
              ))}
        </motion.div>
      </div>
    </section>
  )
}
