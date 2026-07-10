import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  CalendarDays,
  Building2,
  Package,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { usePublicEventDetail, useVerifyTeam } from '@/hooks'
import toast from 'react-hot-toast'

export default function PublicEventDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const { data: event, isLoading } = usePublicEventDetail(slug || '')

  // Verification state
  const [teamId, setTeamId] = useState('')
  const verifyMutation = useVerifyTeam()
  const [verifiedTeamData, setVerifiedTeamData] = useState<{ teamId: string; leaderName: string } | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleVerify = () => {
    if (!event) return
    if (!teamId.trim()) {
      setVerificationError('Please enter a Team ID.')
      return
    }

    setVerificationError(null)
    setVerifiedTeamData(null)
    setConfirmed(false)

    verifyMutation.mutate(
      { eventId: event._id, teamId: teamId.trim() },
      {
        onSuccess: (data: any) => {
          setVerifiedTeamData({ teamId: data.teamId, leaderName: data.leaderName })
          setToken(data.token)
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || 'Verification failed.'
          setVerificationError(msg)
        },
      }
    )
  }

  const handleConfirm = () => {
    setConfirmed(true)
    toast.success(`Welcome ${verifiedTeamData?.leaderName}! Team confirmed.`)
  }

  const handleProceedToPurchase = () => {
    if (!event || !token) return
    navigate(`/events/${event._id}/checkout`, { state: { token } })
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
      <div className="text-center py-16 container max-w-md mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive/40" />
        <h3 className="text-base font-bold text-foreground">Event not found</h3>
        <p className="text-xs text-muted-foreground">
          The event you are looking for is either unavailable or has not been published yet.
        </p>
        <Button variant="outline" onClick={() => navigate('/events')}>
          Back to Events Catalog
        </Button>
      </div>
    )
  }

  const startDate = new Date(event.startDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const endDate = new Date(event.endDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  // Date calculation
  const today = new Date()
  const closingDate = new Date(event.endDate)
  today.setHours(0, 0, 0, 0)
  closingDate.setHours(0, 0, 0, 0)
  const timeDiff = closingDate.getTime() - today.getTime()
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24))
  const isClosed = daysRemaining < 0

  const discount = Math.max(0, event.totalKitValue - event.eventKitPrice)
  const discountPct =
    event.totalKitValue > 0
      ? Math.max(0, Math.round((discount / event.totalKitValue) * 10000) / 100)
      : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/events')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Events list
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Event information & products list */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="p-0 border-b border-border">
              {event.banner?.url ? (
                <div className="h-64 sm:h-80 w-full overflow-hidden">
                  <img
                    src={event.banner.url}
                    alt={event.eventName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 bg-muted flex items-center justify-center text-muted-foreground/30 font-mono text-sm">
                  SHORT CIRCUIT COLLEGE EVENT
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {event.eventName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="font-semibold text-foreground">{event.organizationName}</span>
                  <span className="text-border">|</span>
                  <span>{event.collegeName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span>
                    {startDate} - {endDate}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isClosed ? (
                    <span className="font-bold text-destructive bg-destructive/10 rounded-full px-2.5 py-0.5">
                      Registration Closed
                    </span>
                  ) : (
                    <span className="font-bold text-warning bg-warning/10 rounded-full px-2.5 py-0.5 animate-pulse">
                      Registration Closes In: {daysRemaining === 0 ? 'Today' : `${daysRemaining} days`}
                    </span>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground">About the Event</h3>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Kit Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Virtual Event Kit Contents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!event.kitProducts || event.kitProducts.length === 0) ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No components configured in this event bundle.
                </p>
              ) : (
                <div className="space-y-4">
                  {event.kitProducts.map((item) => (
                    <div
                      key={item.product as string}
                      className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/10 transition-colors"
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

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground">x{item.quantity}</span>
                        <div className="text-right min-w-[70px]">
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

        {/* Right 1 col: Team verification & kit pricing */}
        <div className="space-y-6">
          {/* 1. Team verification card */}
          <Card className="border-primary/20 shadow-sm relative overflow-hidden">
            <CardHeader className="bg-primary/5 pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Users className="h-4.5 w-4.5 text-primary" />
                Team ID Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <AnimatePresence mode="wait">
                {confirmed ? (
                  // State 3: Confirmed state
                  <motion.div
                    key="confirmed"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="rounded-xl border border-success/20 bg-success/5 p-3.5 text-center space-y-2">
                      <CheckCircle className="h-8 w-8 text-success mx-auto" />
                      <h4 className="font-bold text-success text-sm">Team Registration Verified</h4>
                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">
                          Team ID: <span className="font-bold text-foreground">{verifiedTeamData?.teamId}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Leader Name: <span className="font-bold text-foreground">{verifiedTeamData?.leaderName}</span>
                        </p>
                      </div>
                    </div>
                    <Button onClick={handleProceedToPurchase} className="w-full h-10 font-bold text-xs">
                      Proceed to Purchase Kit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setConfirmed(false)
                        setVerifiedTeamData(null)
                        setTeamId('')
                      }}
                      className="w-full text-muted-foreground"
                    >
                      Change Team ID
                    </Button>
                  </motion.div>
                ) : verifiedTeamData ? (
                  // State 2: Success Verification Preview
                  <motion.div
                    key="verified"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="rounded-xl border border-success/20 bg-success/5 p-3.5 space-y-2">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                        <span className="text-xs font-bold">Team Found</span>
                      </div>
                      <Separator className="bg-success/10" />
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <p>
                          Team ID: <span className="font-bold text-foreground">{verifiedTeamData.teamId}</span>
                        </p>
                        <p>
                          Leader Name: <span className="font-bold text-foreground">{verifiedTeamData.leaderName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-center">
                      <p className="text-xs font-medium text-foreground">Is this your team?</p>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 text-xs" onClick={() => setVerifiedTeamData(null)}>
                          No
                        </Button>
                        <Button className="flex-1 text-xs" onClick={handleConfirm}>
                          Yes, Confirm
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  // State 1: Input Team ID
                  <motion.div
                    key="verify-input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {isClosed ? (
                      <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-3 rounded-xl font-medium">
                        Registration for this event closed on {endDate}. Team ID verification is no longer available.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Only students registered in eligible teams can purchase this kit. Enter your Team ID below to verify eligibility.
                        </p>
                        <div className="space-y-2">
                          <label htmlFor="teamIdInput" className="text-xs font-semibold text-muted-foreground">
                            Team ID
                          </label>
                          <Input
                            id="teamIdInput"
                            placeholder="e.g. BOT001"
                            value={teamId}
                            onChange={(e) => setTeamId(e.target.value)}
                            className="font-bold text-foreground uppercase"
                          />
                        </div>

                        {verificationError && (
                          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive flex items-start gap-2 font-medium">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{verificationError}</span>
                          </div>
                        )}

                        <Button
                          onClick={handleVerify}
                          loading={verifyMutation.isPending}
                          className="w-full text-xs font-semibold h-10"
                        >
                          Verify Team Eligibility
                        </Button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Pricing Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Pricing & Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Kit Value</span>
                  <span className="font-bold text-foreground">₹{event.totalKitValue}</span>
                </div>
                <div className="flex justify-between text-success font-medium">
                  <span>Special Event Discount</span>
                  <span>
                    -₹{discount} ({discountPct}% off)
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-extrabold py-0.5">
                  <span className="text-foreground">Amount to Pay</span>
                  <span className="text-lg text-primary">₹{event.eventKitPrice}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
