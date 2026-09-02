import { Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  Cpu, Bot, Satellite, CircuitBoard, Wrench, Radio,
  Settings, Gauge, Binary, Microchip,
} from 'lucide-react'
import { useCategories } from '@/hooks/useHomeData'
import { SectionHeader } from './SectionHeader'

// ─── Fallback Categories ────────────────────────────────────────────────────────

const fallbackCategories = [
  { name: 'Drone Components', slug: 'drone-components', icon: Radio },
  { name: 'Robotics Components', slug: 'robotics-components', icon: Bot },
  { name: 'IoT Sensors', slug: 'iot-sensors', icon: Satellite },
  { name: 'Development Boards', slug: 'development-boards', icon: CircuitBoard },
  { name: 'DIY Engineering Kits', slug: 'diy-engineering-kits', icon: Wrench },
  { name: 'Embedded Systems', slug: 'embedded-systems', icon: Cpu },
  { name: 'Actuators & Motors', slug: 'actuators-motors', icon: Settings },
  { name: 'Power Modules', slug: 'power-modules', icon: Gauge },
  { name: 'Control Interfaces', slug: 'control-interfaces', icon: Binary },
  { name: 'Microcontrollers', slug: 'microcontrollers', icon: Microchip },
]

function getCategoryIcon(name: string, slug?: string) {
  const s = `${slug || ''} ${name}`.toLowerCase()
  if (s.includes('drone')) return Radio
  if (s.includes('robot')) return Bot
  if (s.includes('sensor')) return Satellite
  if (s.includes('board') || s.includes('develop')) return CircuitBoard
  if (s.includes('kit') || s.includes('diy')) return Wrench
  if (s.includes('motor') || s.includes('actuator')) return Settings
  if (s.includes('power') || s.includes('module') || s.includes('battery')) return Gauge
  if (s.includes('control') || s.includes('interface')) return Binary
  if (s.includes('micro') || s.includes('chip')) return Microchip
  return Cpu
}

// ─── Category Showcase ──────────────────────────────────────────────────────────

export default function CategoryShowcase() {
  const { data: apiCategories } = useCategories()

  const categories = apiCategories && apiCategories.length > 0
    ? apiCategories.slice(0, 10)
    : null

  const displayList = categories || fallbackCategories

  return (
    <section className="py-10 lg:py-20">
      <div className="container">
        <SectionHeader
          title="Shop by Category"
          subtitle="Drone Components, Robotics Components, IoT Sensors, Development Boards, and DIY Engineering Kits"
          link="/categories"
          linkText="All Categories"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {displayList.map((cat) => {
            const hasImage = 'image' in cat && cat.image?.url
            const Icon = 'icon' in cat && typeof cat.icon !== 'string' && cat.icon
              ? cat.icon
              : getCategoryIcon(cat.name, cat.slug)

            return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Link
                  to={`/category/${cat.slug}`}
                  className="group glass flex flex-col items-center gap-2 sm:gap-3 rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/25 text-center"
                >
                  {hasImage ? (
                    <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-xl overflow-hidden bg-muted">
                      <img src={(cat as any).image.url} alt={cat.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20 group-hover:scale-105">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-medium text-foreground line-clamp-1">
                    {cat.name}
                  </span>
                  {'productCount' in cat && (cat as any).productCount !== undefined && (
                    <span className="text-[11px] text-muted-foreground">
                      {(cat as any).productCount} products
                    </span>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
