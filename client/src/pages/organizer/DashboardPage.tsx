import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { CalendarDays, PlusCircle, Clock, FileEdit, CheckCircle } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin'
import { StatCard } from '@/components/admin/stat-card'
import { useMyEvents } from '@/hooks'
import { useAuthStore } from '@/store'
import { Skeleton } from '@/components/ui/loader'
import { staggerContainer, fadeInUp } from '@/config/animations'

// ─── Organizer Dashboard ────────────────────────────────────────────────────────

export default function OrganizerDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useMyEvents({ page: 1, limit: 100 })

  const events = data?.events || []
  const draftCount = events.filter((e) => e.status === 'draft').length
  const pendingCount = events.filter((e) => e.status === 'pending').length
  const approvedCount = events.filter((e) => e.status === 'approved').length
  const totalCount = events.length

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={`Welcome, ${user?.firstName || 'Organizer'}!`}
        description={
          user?.organizerProfile
            ? `${user.organizerProfile.organizationName} • ${user.organizerProfile.collegeName}`
            : 'Manage your events and kits'
        }
        action={
          <Link
            to="/organizer/events/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Create Event
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={fadeInUp}>
            <StatCard
              title="Total Events"
              value={totalCount}
              icon={CalendarDays}
              iconColor="primary"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              title="Drafts"
              value={draftCount}
              icon={FileEdit}
              iconColor="info"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              title="Pending Review"
              value={pendingCount}
              icon={Clock}
              iconColor="warning"
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <StatCard
              title="Approved"
              value={approvedCount}
              icon={CheckCircle}
              iconColor="success"
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
