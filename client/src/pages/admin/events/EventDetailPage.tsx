import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  X,
  Mail,
  User,
  Package,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AdminPageHeader } from '@/components/admin'
import { ReadinessChecklist } from '@/components/event/ReadinessChecklist'
import { useAdminEventDetail, useApproveEvent, useRejectEvent } from '@/hooks'
import toast from 'react-hot-toast'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: event, isLoading, refetch } = useAdminEventDetail(id || '')

  // Actions hooks
  const approveMutation = useApproveEvent()
  const rejectMutation = useRejectEvent()

  // Modal State
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = () => {
    if (!id || !event) return
    if (window.confirm(`Are you sure you want to approve "${event.eventName}"?`)) {
      approveMutation.mutate(id, {
        onSuccess: () => {
          refetch()
        },
      })
    }
  }

  const handleRejectSubmit = () => {
    if (!id) return
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      toast.error('Please enter a rejection reason (minimum 5 characters).')
      return
    }

    rejectMutation.mutate(
      { id, rejectionReason },
      {
        onSuccess: () => {
          setRejecting(false)
          setRejectionReason('')
          refetch()
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-semibold">Event not found.</p>
        <Button variant="outline" onClick={() => navigate('/admin/events')} className="mt-3">
          Back to Events List
        </Button>
      </div>
    )
  }

  const org = typeof event.organizer === 'object' ? event.organizer : null
  const organizerName = org ? `${org.firstName} ${org.lastName}` : 'Unknown Organizer'
  const organizerEmail = org ? org.email : 'N/A'
  const isPending = event.status === 'pending'
  const isRejected = event.status === 'rejected'

  const discount = Math.max(0, event.totalKitValue - event.eventKitPrice)
  const discountPct =
    event.totalKitValue > 0
      ? Math.max(0, Math.round((discount / event.totalKitValue) * 10000) / 100)
      : 0

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Event Review Detail"
        description="Review kit contents, team logs, and event information before approving."
        action={
          <Button variant="outline" onClick={() => navigate('/admin/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        }
      />

      {isRejected && event.rejectionReason && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-foreground">Previously Rejected</h4>
            <p className="font-semibold">{event.rejectionReason}</p>
            {event.reviewedAt && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Reviewed on: {new Date(event.reviewedAt).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Event details & Kit bundle */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Main Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.banner?.url && (
                <div className="h-56 bg-muted rounded-xl overflow-hidden border border-border">
                  <img
                    src={event.banner.url}
                    alt={event.eventName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">{event.eventName}</h3>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 2. Bundle Kit Products (Snapshotted) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Snapshotted Kit Bundle Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!event.kitProducts || event.kitProducts.length === 0) ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No products snapshotted in this event kit.
                </p>
              ) : (
                <div className="space-y-4">
                  {event.kitProducts.map((item) => (
                    <div
                      key={item.product as string}
                      className="flex items-center justify-between rounded-xl border border-border p-3 bg-card"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="h-12 w-12 rounded-lg object-cover bg-muted shrink-0"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-foreground line-clamp-1">
                            {item.productName}
                          </h4>
                          <p className="text-[10px] text-muted-foreground">SKU: {item.productSku}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Unit Price: ₹{item.priceAtCreation}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Quantity</p>
                          <p className="text-xs font-bold text-foreground">x{item.quantity}</p>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <p className="text-[10px] text-muted-foreground">Total</p>
                          <p className="text-xs font-bold text-foreground">
                            ₹{item.priceAtCreation * item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Organizer info, checklist & statistics */}
        <div className="space-y-6">
          {/* 1. Organizer Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Organizer Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border border-border">
                <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {organizerName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-foreground truncate">{organizerName}</h4>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{organizerEmail}</span>
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organization</span>
                  <span className="font-semibold text-foreground text-right">{event.organizationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">College</span>
                  <span className="font-semibold text-foreground text-right">{event.collegeName}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Readiness checklist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Event Readiness</CardTitle>
            </CardHeader>
            <CardContent>
              <ReadinessChecklist event={event} />
            </CardContent>
          </Card>

          {/* 3. Stats & Pricing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Pricing & Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-2.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Kit Value</span>
                  <span className="font-bold text-foreground">₹{event.totalKitValue}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Special Event Discount</span>
                  <span className="font-semibold">
                    -₹{discount} ({discountPct}% off)
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-bold">
                  <span>Kit Selling Price</span>
                  <span className="text-foreground text-base">₹{event.eventKitPrice}</span>
                </div>
              </div>

              {isPending && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Button
                    className="w-full text-xs text-white"
                    onClick={handleApprove}
                    loading={approveMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Approve Event
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-xs text-destructive border-destructive/25 hover:bg-destructive/10"
                    onClick={() => setRejecting(true)}
                    loading={rejectMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Reject Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Modal Dialog */}
      <AnimatePresence>
        {rejecting && (
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
                  onClick={() => setRejecting(false)}
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
                <Button variant="outline" onClick={() => setRejecting(false)}>
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
