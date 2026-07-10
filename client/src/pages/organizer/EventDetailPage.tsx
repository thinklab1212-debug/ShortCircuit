import { useParams, Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CalendarDays,
  Pencil,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  FileEdit,
  Award,
  Building2,
  IndianRupee,
  Package,
  Users,
  ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AdminPageHeader } from '@/components/admin'
import { useEventDetail, useDeleteEvent, useSubmitEventForReview } from '@/hooks'
import { fadeInUp, staggerContainer } from '@/config/animations'
import { ReadinessChecklist } from '@/components/event/ReadinessChecklist'

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
    draft: <FileEdit className="h-3.5 w-3.5" />,
    pending: <Clock className="h-3.5 w-3.5" />,
    approved: <CheckCircle className="h-3.5 w-3.5" />,
    rejected: <XCircle className="h-3.5 w-3.5" />,
    completed: <Award className="h-3.5 w-3.5" />,
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium capitalize ${styles[status] || ''}`}>
      {icons[status]}
      {status}
    </span>
  )
}

// ─── Event Detail Page ──────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: event, isLoading } = useEventDetail(id || '')
  const deleteEvent = useDeleteEvent()
  const submitForReview = useSubmitEventForReview()

  if (isLoading || !event) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const isDraft = event.status === 'draft'
  const isRejected = event.status === 'rejected'

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteEvent.mutate(event._id)
    }
  }

  const handleSubmit = () => {
    if (window.confirm('Submit this event for admin review? You won\'t be able to edit it until the review is complete.')) {
      submitForReview.mutate(event._id)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={event.eventName}
        description={event.collegeName}
        action={
          <Button variant="outline" onClick={() => navigate('/organizer/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        }
      />

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Banner */}
          <motion.div variants={fadeInUp}>
            {event.banner?.url ? (
              <div className="rounded-xl overflow-hidden">
                <img
                  src={event.banner.url}
                  alt={event.eventName}
                  className="w-full h-56 object-cover"
                />
              </div>
            ) : (
              <div className="h-56 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <CalendarDays className="h-16 w-16 text-primary/30" />
              </div>
            )}
          </motion.div>

          {/* Rejection Notice */}
          {isRejected && event.rejectionReason && (
            <motion.div variants={fadeInUp}>
              <Card className="border-destructive/30">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-destructive">Rejection Reason</h4>
                      <p className="text-sm text-muted-foreground mt-1">{event.rejectionReason}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Description */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Kit Products */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  Kit Products
                </CardTitle>
                {(isDraft || isRejected) && (
                  <Button asChild size="sm" variant="outline" className="h-8">
                    <Link to={`/organizer/events/${event._id}/kit`}>
                      <Pencil className="h-3 w-3 mr-1.5" />
                      Configure Kit
                    </Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {event.kitProducts && event.kitProducts.length > 0 ? (
                  <div className="space-y-3">
                    {event.kitProducts.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors p-3">
                        <div className="flex items-center gap-3">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="h-10 w-10 rounded-lg object-cover bg-muted"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-semibold text-foreground line-clamp-1">{item.productName}</span>
                            <span className="text-xs text-muted-foreground">
                              ₹{item.priceAtCreation} each
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center justify-center rounded-md bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
                            Qty: {item.quantity}
                          </span>
                          <p className="text-xs font-semibold text-foreground mt-1">
                            ₹{item.priceAtCreation * item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No kit products configured yet.
                    </p>
                    {(isDraft || isRejected) && (
                      <Button asChild size="sm" className="mt-3">
                        <Link to={`/organizer/events/${event._id}/kit`}>
                          Configure Kit
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Status</span>
                  <EventStatusBadge status={event.status} />
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  {isDraft && (
                    <>
                      <Button
                        className="w-full"
                        onClick={handleSubmit}
                        loading={submitForReview.isPending}
                        loadingText="Submitting..."
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit for Approval
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link to={`/organizer/events/${event._id}/edit`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Event
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={handleDelete}
                        loading={deleteEvent.isPending}
                        loadingText="Deleting..."
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Event
                      </Button>
                    </>
                  )}
                  {isRejected && (
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/organizer/events/${event._id}/edit`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit & Resubmit
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Readiness Checklist */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Event Readiness</CardTitle>
              </CardHeader>
              <CardContent>
                <ReadinessChecklist event={event} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Event Details */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    College
                  </span>
                  <span className="font-medium text-right max-w-[160px] truncate">{event.collegeName}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    Start Date
                  </span>
                  <span className="font-medium">
                    {new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    End Date
                  </span>
                  <span className="font-medium">
                    {new Date(event.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <IndianRupee className="h-4 w-4" />
                    Kit Price
                  </span>
                  <span className="font-semibold text-foreground">₹{event.eventKitPrice}</span>
                </div>
                {event.totalKitValue > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Package className="h-4 w-4" />
                      Kit Value
                    </span>
                    <span className="font-medium">₹{event.totalKitValue}</span>
                  </div>
                )}
                {event.discount && event.discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-success">
                      <IndianRupee className="h-4 w-4" />
                      Discount
                    </span>
                    <span className="font-medium text-success">
                      ₹{event.discount} ({event.discountPercentage}% off)
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Teams
                  </span>
                  <span className="font-medium">
                    {event.purchasedTeams || 0} / {event.totalTeams || 0}
                  </span>
                </div>
                <div className="pt-2 space-y-2">
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link to={`/organizer/events/${event._id}/teams`}>
                      <Users className="h-3.5 w-3.5 mr-1.5" />
                      Manage Teams list
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="w-full text-primary hover:text-primary hover:bg-primary/5 border-primary/10">
                    <Link to={`/organizer/events/${event._id}/purchases`}>
                      <ShoppingBag className="h-3.5 w-3.5 mr-1.5 text-primary" />
                      View Purchases list
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Metadata */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardContent className="py-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{new Date(event.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated</span>
                  <span>{new Date(event.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
