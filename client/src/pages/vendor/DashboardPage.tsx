import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  Package,
  FileEdit,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { vendorApi } from '@/services/vendorApi'
import { AdminPageHeader } from '@/components/admin'
import { StatCard } from '@/components/admin/stat-card'
import { ErrorFallback } from '@/components/ui/error'
import { Skeleton } from '@/components/ui/loader'
import { staggerContainer } from '@/config/animations'

// ─── Vendor Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vendor', 'dashboard'],
    queryFn: () => vendorApi.getDashboard().then((res) => res.data.data),
  })

  if (isError) {
    return (
      <ErrorFallback
        error={error as Error}
        resetErrorBoundary={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Vendor Dashboard"
        description="Overview of your product submissions"
        action={
          <Link
            to="/vendor/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Package className="h-4 w-4" />
            Add Product
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5"
        >
          <StatCard
            title="Total Products"
            value={(data?.total ?? 0).toString()}
            icon={Package}
            iconColor="primary"
          />
          <StatCard
            title="Draft"
            value={(data?.draft ?? 0).toString()}
            icon={FileEdit}
            iconColor="info"
          />
          <StatCard
            title="Pending Review"
            value={(data?.pendingReview ?? 0).toString()}
            icon={Clock}
            iconColor="warning"
          />
          <StatCard
            title="Approved"
            value={(data?.approved ?? 0).toString()}
            icon={CheckCircle}
            iconColor="success"
          />
          <StatCard
            title="Rejected"
            value={(data?.rejected ?? 0).toString()}
            icon={XCircle}
            iconColor="error"
          />
        </motion.div>
      )}
    </div>
  )
}
