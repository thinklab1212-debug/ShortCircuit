import { useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import {
  PlusCircle,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileEdit,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AdminPageHeader } from '@/components/admin'
import { useMyEvents, useDeleteEvent } from '@/hooks'
import { fadeInUp, staggerContainer } from '@/config/animations'
import type { Event } from '@/types'

// ─── Status Badge ───────────────────────────────────────────────────────────────

function EventStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    pending: 'bg-warning/10 text-warning',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
    completed: 'bg-primary/10 text-primary',
  }
  const icons: Record<string, React.ReactNode> = {
    draft: <FileEdit className="h-3 w-3" />,
    pending: <Clock className="h-3 w-3" />,
    approved: <CheckCircle className="h-3 w-3" />,
    rejected: <XCircle className="h-3 w-3" />,
    completed: <Award className="h-3 w-3" />,
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] || ''}`}>
      {icons[status]}
      {status}
    </span>
  )
}

// ─── Event Card ─────────────────────────────────────────────────────────────────

function EventCard({ event, onDelete }: { event: Event; onDelete: (id: string) => void }) {
  const isDraft = event.status === 'draft'

  return (
    <motion.div variants={fadeInUp}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Banner */}
        {event.banner?.url && (
          <div className="relative h-40 overflow-hidden">
            <img
              src={event.banner.url}
              alt={event.eventName}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-3 right-3">
              <EventStatusBadge status={event.status} />
            </div>
          </div>
        )}
        {!event.banner?.url && (
          <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <CalendarDays className="h-12 w-12 text-primary/30" />
            <div className="absolute top-3 right-3">
              <EventStatusBadge status={event.status} />
            </div>
          </div>
        )}

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1">{event.eventName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{event.collegeName}</p>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              <span>
                {new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                {' — '}
                {new Date(event.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <span className="font-medium text-foreground">₹{event.eventKitPrice}</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link to={`/organizer/events/${event._id}`}>
                <Eye className="h-3.5 w-3.5 mr-1" />
                View
              </Link>
            </Button>
            {isDraft && (
              <>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`/organizer/events/${event._id}/edit`}>
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => onDelete(event._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── My Events Page ─────────────────────────────────────────────────────────────

export default function MyEventsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { data, isLoading } = useMyEvents({
    page,
    limit: 12,
    status: statusFilter || undefined,
  })
  const deleteEvent = useDeleteEvent()

  const events = data?.events || []
  const pagination = data?.pagination

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this draft event?')) {
      deleteEvent.mutate(id)
    }
  }

  const statusFilters = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="My Events"
        description="Manage your events and kits"
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

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {statusFilters.map((f) => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setStatusFilter(f.value)
                  setPage(1)
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <CalendarDays className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No events yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {statusFilter ? `No ${statusFilter} events found.` : 'Create your first event to get started.'}
            </p>
            <Button asChild>
              <Link to="/organizer/events/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {events.map((event) => (
            <EventCard key={event._id} event={event} onDelete={handleDelete} />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
