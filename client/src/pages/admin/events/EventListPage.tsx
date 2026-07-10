import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  Check,
  X,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AdminPageHeader } from '@/components/admin'
import { useAdminEvents, useApproveEvent, useRejectEvent } from '@/hooks'
import { fadeInUp, staggerContainer } from '@/config/animations'
import type { Event } from '@/types'
import toast from 'react-hot-toast'

export default function EventListPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'completed'>('pending')
  const [page, setPage] = useState(1)

  // Fetch events using hook
  const { data, isLoading, refetch } = useAdminEvents({
    page,
    limit: 10,
    status: activeTab,
  })

  const eventsList = data?.events || []
  const pagination = data?.pagination

  // Actions hooks
  const approveMutation = useApproveEvent()
  const rejectMutation = useRejectEvent()

  // Modal State for Rejection Reason
  const [rejectingEvent, setRejectingEvent] = useState<Event | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Approve Handler
  const handleApprove = (event: Event) => {
    if (window.confirm(`Are you sure you want to approve the event: "${event.eventName}"?`)) {
      approveMutation.mutate(event._id, {
        onSuccess: () => {
          refetch()
        },
      })
    }
  }

  // Reject Modal Handler
  const openRejectModal = (event: Event) => {
    setRejectingEvent(event)
    setRejectionReason('')
  }

  const handleRejectSubmit = () => {
    if (!rejectingEvent) return
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      toast.error('Please enter a rejection reason (minimum 5 characters).')
      return
    }

    rejectMutation.mutate(
      { id: rejectingEvent._id, rejectionReason },
      {
        onSuccess: () => {
          setRejectingEvent(null)
          setRejectionReason('')
          refetch()
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Event Reviews & Approvals"
        description="Review, approve, and reject college-level Virtual Bundle Event Kit builder submissions."
      />

      {/* Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-px">
        {(['pending', 'approved', 'rejected', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setPage(1)
            }}
            className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-all -mb-px shrink-0 ${
              activeTab === tab
                ? 'border-primary text-primary bg-primary/5 font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab} Events
          </button>
        ))}
      </div>

      {/* Main List Area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : eventsList.length === 0 ? (
        <div className="text-center py-20 bg-muted/10 border border-dashed border-border rounded-2xl">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="text-base font-bold text-foreground">No events found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            There are no {activeTab} events registered in the system right now.
          </p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {eventsList.map((event) => {
            const org = typeof event.organizer === 'object' ? event.organizer : null
            const organizerName = org ? `${org.firstName} ${org.lastName}` : 'Unknown Organizer'
            const teamCount = event.totalTeams || event.teams?.length || 0

            return (
              <motion.div key={event._id} variants={fadeInUp}>
                <Card className="h-full flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow">
                  <div>
                    {/* Header Image */}
                    <div className="relative h-44 bg-muted overflow-hidden border-b border-border">
                      {event.banner?.url ? (
                        <img
                          src={event.banner.url}
                          alt={event.eventName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground/40 font-mono text-xs">
                          NO BANNER IMAGE
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        {event.status}
                      </div>
                    </div>

                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg font-bold line-clamp-1">{event.eventName}</CardTitle>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{event.organizationName} ({event.collegeName})</span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-1 pb-2 space-y-2 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Submitted By</span>
                        <span className="font-semibold text-foreground">{organizerName}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Submission Date</span>
                        <span className="font-semibold text-foreground">
                          {new Date(event.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <Separator className="my-1.5" />
                      <div className="grid grid-cols-3 gap-2 py-1 bg-muted/30 rounded-lg text-center font-medium">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Teams</p>
                          <p className="text-sm font-bold text-foreground">{teamCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Kit Value</p>
                          <p className="text-sm font-bold text-foreground">₹{event.totalKitValue}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Kit Sell Price</p>
                          <p className="text-sm font-bold text-foreground">₹{event.eventKitPrice}</p>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <div className="p-4 pt-2 border-t border-border flex justify-end gap-2 bg-muted/10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/events/${event._id}`)}
                      className="text-xs h-9 px-3"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Details
                    </Button>

                    {activeTab === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(event)}
                          loading={approveMutation.isPending}
                          className="text-xs text-success border-success/30 hover:bg-success/10 h-9 px-3"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRejectModal(event)}
                          loading={rejectMutation.isPending}
                          className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 h-9 px-3"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm font-semibold text-muted-foreground px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Rejection Modal Dialog */}
      <AnimatePresence>
        {rejectingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-2xl max-w-md w-full border border-border overflow-hidden shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-foreground">Reject Event Submission</h3>
                <button
                  type="button"
                  onClick={() => setRejectingEvent(null)}
                  className="rounded-full hover:bg-muted p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Please provide a detailed rejection reason. The organizer will see this feedback and can edit and resubmit their event.
                </p>
                <textarea
                  placeholder="e.g. The pricing is too high, or the product list is missing key required hardware items."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full min-h-[100px] text-xs p-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  maxLength={500}
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {rejectionReason.length}/500 chars (min 5 chars)
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setRejectingEvent(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRejectSubmit}
                  loading={rejectMutation.isPending}
                  disabled={rejectionReason.trim().length < 5}
                  className="bg-destructive hover:bg-destructive/95"
                >
                  Confirm Rejection
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
