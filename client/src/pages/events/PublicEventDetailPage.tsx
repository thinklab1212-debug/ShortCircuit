import { useState, useEffect } from 'react'
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
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { usePublicEventDetail, useVerifyTeam } from '@/hooks'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'

interface UnlockedKitData {
  teamId: string
  leaderName: string
  token: string
  kitProducts: Array<{
    product: string
    productName: string
    productSku: string
    productImage?: string
    priceAtCreation: number
    quantity: number
  }>
  eventKitPrice: number
  totalKitValue: number
  discount: number
  discountPercentage: number
}

export default function PublicEventDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const { data: event, isLoading } = usePublicEventDetail(slug || '')

  // Verification state
  const [teamId, setTeamId] = useState('')
  const verifyMutation = useVerifyTeam()
  const [unlockedKitData, setUnlockedKitData] = useState<UnlockedKitData | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  // Restore unlocked kit data from sessionStorage if previously verified in this session
  useEffect(() => {
    if (event?._id) {
      const cached = sessionStorage.getItem(`shortcircuit_event_unlocked_${event._id}`)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (parsed && parsed.token && parsed.teamId && parsed.kitProducts) {
            setUnlockedKitData(parsed)
            setToken(parsed.token)
          }
        } catch {
          sessionStorage.removeItem(`shortcircuit_event_unlocked_${event._id}`)
        }
      }
    }
  }, [event?._id])

  const handleVerify = () => {
    if (!event) return

    if (!isAuthenticated) {
      toast.error('Please sign in to verify your team and unlock exclusive pricing.')
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    if (!teamId.trim()) {
      setVerificationError('Please enter your Team ID.')
      return
    }

    setVerificationError(null)

    verifyMutation.mutate(
      { eventId: event._id, teamId: teamId.trim() },
      {
        onSuccess: (data: any) => {
          setUnlockedKitData(data)
          setToken(data.token)
          if (event?._id) {
            sessionStorage.setItem(`shortcircuit_event_unlocked_${event._id}`, JSON.stringify(data))
          }
          toast.success(`Team ${data.teamId} verified! Hardware kit & pricing unlocked.`)
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || 'Verification failed.'
          setVerificationError(msg)
        },
      }
    )
  }

  const handleClearUnlocked = () => {
    setUnlockedKitData(null)
    setToken(null)
    setTeamId('')
    if (event?._id) {
      sessionStorage.removeItem(`shortcircuit_event_unlocked_${event._id}`)
    }
  }

  const handleProceedToPurchase = () => {
    const activeToken = token || unlockedKitData?.token
    if (!event || !activeToken) return
    navigate(`/events/${event._id}/checkout`, { state: { token: activeToken } })
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
        {/* Left 2 cols: Event information & products list (locked/unlocked) */}
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

          {/* Kit Products: Gated or Unlocked */}
          <AnimatePresence mode="wait">
            {unlockedKitData ? (
              <motion.div
                key="unlocked-kit"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-primary/20 shadow-sm">
                  <CardHeader className="bg-primary/5 pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Package className="h-4.5 w-4.5 text-primary" />
                      Virtual Event Kit Contents
                      <span className="ml-auto text-xs font-bold text-success bg-success/10 border border-success/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Unlocked for {unlockedKitData.teamId}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {(!unlockedKitData.kitProducts || unlockedKitData.kitProducts.length === 0) ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No components configured in this event bundle.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {unlockedKitData.kitProducts.map((item) => (
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
                              <span className="text-xs font-semibold text-muted-foreground">
                                x{item.quantity}
                              </span>
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
              </motion.div>
            ) : (
              <motion.div
                key="locked-kit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-border border-dashed bg-muted/5 overflow-hidden">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                      <Lock className="h-8 w-8" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="text-lg font-bold text-foreground">
                        Hardware Kit Components & Pricing Locked
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The component specifications and negotiated subsidized pricing are reserved exclusively for registered teams of{' '}
                        <strong className="text-foreground">{event.organizationName} ({event.collegeName})</strong>.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        <span>Verified Student Access</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
                        <Sparkles className="h-3.5 w-3.5 text-success" />
                        <span>Subsidized Partner Rates</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 italic pt-1">
                      👉 Enter your Team ID in the verification box to unlock kit components and pricing.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right 1 col: Team verification & kit pricing */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {unlockedKitData ? (
              <motion.div
                key="unlocked-right"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* 1. Team Verified Card */}
                <Card className="border-success/30 bg-success/5 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-success">
                      <CheckCircle className="h-4.5 w-4.5" />
                      Team Verified
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div className="rounded-lg bg-card border border-success/20 p-3 space-y-1">
                      <p className="text-muted-foreground">
                        Team ID: <span className="font-bold text-foreground">{unlockedKitData.teamId}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Leader Name: <span className="font-bold text-foreground">{unlockedKitData.leaderName}</span>
                      </p>
                    </div>
                    <Button onClick={handleProceedToPurchase} className="w-full h-10 font-bold text-xs">
                      Proceed to Checkout
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearUnlocked}
                      className="w-full text-muted-foreground text-xs"
                    >
                      Change Team ID
                    </Button>
                  </CardContent>
                </Card>

                {/* 2. Unlocked Pricing Panel */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Pricing & Value</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3.5 text-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total Kit Value</span>
                        <span className="font-bold text-foreground">₹{unlockedKitData.totalKitValue}</span>
                      </div>
                      <div className="flex justify-between text-success font-medium">
                        <span>Special Event Discount</span>
                        <span>
                          -₹{unlockedKitData.discount} ({unlockedKitData.discountPercentage}% off)
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm font-extrabold py-0.5">
                        <span className="text-foreground">Amount to Pay</span>
                        <span className="text-lg text-primary">₹{unlockedKitData.eventKitPrice}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="locked-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* 1. Team ID verification card */}
                <Card className="border-primary/20 shadow-sm relative overflow-hidden">
                  <CardHeader className="bg-primary/5 pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <Users className="h-4.5 w-4.5 text-primary" />
                      Team ID Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {isClosed ? (
                      <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-3 rounded-xl font-medium">
                        Registration for this event closed on {endDate}. Team ID verification is no longer available.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Only registered participants can view kit contents and purchase this kit. Enter your Team ID below to unlock.
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
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleVerify()
                            }}
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
                          Verify & Unlock Kit
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Locked Pricing Card */}
                <Card className="border-border bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      Exclusive Partner Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-muted-foreground">
                    <p>
                      Event kits include special institutional pricing negotiated directly with college organizers.
                    </p>
                    <div className="p-3 rounded-lg bg-card/60 border border-border/60 text-center space-y-1">
                      <span className="font-bold text-xs text-foreground block">🔒 Pricing Hidden</span>
                      <span className="text-[10px] text-muted-foreground">
                        Enter Team ID above to reveal exclusive rates
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
