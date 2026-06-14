import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import {
  MapPin,
  CreditCard,
  Banknote,
  Plus,
  Check,
  Tag,
  LogIn,
  ShoppingBag,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useCart, useCartTotals, useAddresses, usePlaceOrder } from '@/hooks'
import { useAuthStore } from '@/store'
import { couponApi, paymentApi } from '@/services'
import { formatPrice, primaryImage, getUserName } from '@/utils'
import env from '@/config/env'
import { fadeInUp, staggerContainer } from '@/config/animations'
import type { Address, PaymentMethod, Order } from '@/types'

// ─── Razorpay global ──────────────────────────────────────────────────────────

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ─── Address card ─────────────────────────────────────────────────────────────

function AddressCard({
  address,
  selected,
  onSelect,
}: {
  address: Address
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all',
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border hover:border-primary/40'
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
        )}
      >
        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{address.fullName}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {address.type}
          </span>
          {address.isDefault && (
            <span className="rounded bg-success-50 px-1.5 py-0.5 text-[10px] font-medium text-success-700 dark:bg-success-950/50 dark:text-success-400">
              Default
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {address.addressLine1}
          {address.addressLine2 ? `, ${address.addressLine2}` : ''}
          {address.landmark ? `, ${address.landmark}` : ''}, {address.city}, {address.state}{' '}
          {address.pincode}, {address.country}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Phone: {address.phone}</p>
      </div>
    </button>
  )
}

// ─── Payment option ───────────────────────────────────────────────────────────

function PaymentOption({
  selected,
  disabled,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all',
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border hover:border-primary/40',
        disabled && 'opacity-50 cursor-not-allowed hover:border-border'
      )}
    >
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
        )}
      >
        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}

// ─── Checkout Page ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const { data: cart } = useCart()
  const { data: addresses, isLoading: addressesLoading } = useAddresses()
  const placeOrder = usePlaceOrder()

  const isCodAllowed = (() => {
    const saved = localStorage.getItem('store-preferences')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.cod !== false
      } catch {}
    }
    return true
  })()

  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(isCodAllowed ? 'cod' : 'razorpay')
  const [customerNote, setCustomerNote] = useState('')
  const [orderEmail, setOrderEmail] = useState(user?.email || '')

  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(undefined)
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { data: totals } = useCartTotals(appliedCoupon)

  // Preselect the default address (or the first one) once addresses load.
  const resolvedAddressId = useMemo(() => {
    if (selectedAddressId) return selectedAddressId
    if (!addresses || addresses.length === 0) return ''
    const def = addresses.find((a) => a.isDefault)
    return def?._id ?? addresses[0]._id
  }, [selectedAddressId, addresses])

  // ── Auth guard ──
  if (!isAuthenticated) {
    return (
      <div className="container py-16">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <LogIn className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-xl font-semibold text-foreground">Sign in to check out</h1>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Please log in to your account to complete your purchase.
          </p>
          <Button asChild>
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const items = cart?.items ?? []

  // ── Empty cart guard ──
  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-xl font-semibold text-foreground">Your cart is empty</h1>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Add some products to your cart before checking out.
          </p>
          <Button asChild>
            <Link to="/shop">Browse Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  const itemsPrice = totals?.itemsPrice ?? cart?.totalPrice ?? 0
  const shippingPrice = totals?.shippingPrice ?? 0
  const discountAmount = totals?.discountAmount ?? 0
  const totalPrice = totals?.totalPrice ?? cart?.totalPrice ?? 0

  // ── Coupon ──
  const handleApplyCoupon = async () => {
    const code = couponInput.trim()
    if (!code) return
    setApplyingCoupon(true)
    try {
      const res = await couponApi.validate({
        code,
        cartTotal: cart?.totalPrice ?? 0,
        cartCategoryIds: [],
      })
      const result = res.data.data
      const isValid = result.valid ?? result.isApplicable ?? true
      if (!isValid) {
        toast.error(result.reason || result.message || 'Coupon is not applicable')
        return
      }
      setAppliedCoupon(result.code || code)
      toast.success(`Coupon "${result.code || code}" applied`)
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (error as { message?: string })?.message ||
        'Could not apply coupon'
      toast.error(message)
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(undefined)
    setCouponInput('')
  }

  // ── Place order ──
  const handlePlaceOrder = async () => {
    if (!resolvedAddressId) {
      toast.error('Please select a shipping address')
      return
    }

    const trimmedEmail = orderEmail.trim()
    if (!trimmedEmail) {
      toast.error('Please enter an email address for order updates')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    setSubmitting(true)
    try {
      if (paymentMethod === 'cod') {
        const order = await placeOrder.mutateAsync({
          shippingAddressId: resolvedAddressId,
          paymentMethod: 'cod',
          couponCode: appliedCoupon,
          customerNote: customerNote.trim() || undefined,
          email: trimmedEmail,
        })
        toast.success('Order placed successfully!')
        navigate(`/orders/${order._id}`)
        return
      }

      // Razorpay flow
      const order: Order = await placeOrder.mutateAsync({
        shippingAddressId: resolvedAddressId,
        paymentMethod: 'razorpay',
        couponCode: appliedCoupon,
        customerNote: customerNote.trim() || undefined,
        email: trimmedEmail,
      })

      const rzRes = await paymentApi.createOrder({
        orderId: order._id,
        amount: order.totalPrice,
      })
      const rz = rzRes.data.data

      const loaded = await loadRazorpayScript()
      if (!loaded || !window.Razorpay) {
        toast.error('Failed to load payment gateway. Please try again.')
        return
      }

      const rzp = new window.Razorpay({
        key: rz.keyId || env.RAZORPAY_KEY_ID,
        order_id: rz.razorpayOrderId,
        amount: rz.amount,
        currency: rz.currency,
        name: 'Short Circuit',
        handler: async (resp: {
          razorpay_payment_id: string
          razorpay_signature: string
          razorpay_order_id: string
        }) => {
          try {
            await paymentApi.verify({
              razorpayOrderId: rz.razorpayOrderId,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
              orderId: order._id,
            })
            toast.success('Payment successful!')
            navigate(`/orders/${order._id}`)
          } catch {
            toast.error('Payment verification failed. Please contact support.')
          }
        },
        prefill: {
          name: getUserName(user),
          email: orderEmail.trim() || user?.email,
        },
        theme: { color: '#8b5cf6' },
      })
      rzp.open()
    } catch {
      // Errors from mutateAsync already toast via the hook; nothing extra needed.
    } finally {
      setSubmitting(false)
    }
  }

  const placing = submitting || placeOrder.isPending

  return (
    <div className="container py-6 lg:py-8">
      <h1 className="mb-6 text-display-xs sm:text-display-sm font-heading text-foreground">
        Checkout
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: steps */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6 lg:col-span-2"
        >
          {/* Shipping address */}
          <motion.section
            variants={fadeInUp}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Shipping Address</h2>
            </div>

            {addressesLoading ? (
              <div className="space-y-3">
                <div className="h-20 w-full skeleton rounded-xl" />
                <div className="h-20 w-full skeleton rounded-xl" />
              </div>
            ) : addresses && addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <AddressCard
                    key={address._id}
                    address={address}
                    selected={resolvedAddressId === address._id}
                    onSelect={() => setSelectedAddressId(address._id)}
                  />
                ))}
                <Button asChild variant="outline" size="sm" className="mt-1">
                  <Link to="/addresses">
                    <Plus className="h-4 w-4" />
                    Add a new address
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                  You don't have any saved addresses yet.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/addresses">
                    <Plus className="h-4 w-4" />
                    Add address
                  </Link>
                </Button>
              </div>
            )}

            {!addressesLoading && (
              <div className="mt-6 border-t border-border pt-5">
                <label htmlFor="orderEmail" className="block text-sm font-semibold text-foreground mb-1.5">
                  Order Notification Email
                </label>
                <Input
                  id="orderEmail"
                  type="email"
                  required
                  value={orderEmail}
                  onChange={(e) => setOrderEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="max-w-md"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  This email will be used for order-related communication.
                </p>
              </div>
            )}
          </motion.section>

          {/* Payment method */}
          <motion.section
            variants={fadeInUp}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Payment Method</h2>
            </div>
            <div className="space-y-3">
              <PaymentOption
                selected={paymentMethod === 'cod'}
                disabled={!isCodAllowed}
                onSelect={() => setPaymentMethod('cod')}
                icon={<Banknote className="h-5 w-5" />}
                title="Cash on Delivery"
                description={isCodAllowed ? "Pay with cash when your order arrives" : "Currently disabled"}
              />
              <PaymentOption
                selected={paymentMethod === 'razorpay'}
                onSelect={() => setPaymentMethod('razorpay')}
                icon={<CreditCard className="h-5 w-5" />}
                title="Pay Online"
                description="UPI / Card / NetBanking (Razorpay)"
              />
            </div>
          </motion.section>

          {/* Order note */}
          <motion.section
            variants={fadeInUp}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Order Note <span className="text-sm font-normal text-muted-foreground">(optional)</span>
            </h2>
            <Textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Add delivery instructions or any special requests..."
              rows={3}
            />
          </motion.section>
        </motion.div>

        {/* Right: summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>

            {/* Items */}
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted/30">
                    <img
                      src={primaryImage(item.product)}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty {item.quantity} · {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Coupon */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Tag className="h-4 w-4" />
                Coupon code
              </label>
              {appliedCoupon ? (
                <div className="space-y-1.5">
                  <div className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2",
                    totals?.couponError
                      ? "border-destructive/30 bg-destructive/5 text-destructive"
                      : "border-success-300 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-950/40 dark:text-success-400"
                  )}>
                    <span className="text-sm font-medium">
                      {appliedCoupon} {totals?.couponError ? 'invalid' : 'applied'}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-medium text-muted-foreground hover:text-error-500"
                    >
                      Remove
                    </button>
                  </div>
                  {totals?.couponError && (
                    <p className="text-xs text-destructive">{totals.couponError}</p>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleApplyCoupon()
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    loading={applyingCoupon}
                    disabled={!couponInput.trim()}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatPrice(itemsPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-foreground">
                  {shippingPrice === 0 ? 'Free' : formatPrice(shippingPrice)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-success-600 dark:text-success-400">
                  <span>Discount</span>
                  <span className="font-medium">−{formatPrice(discountAmount)}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-base font-semibold text-foreground">Total</span>
                <span className="text-[10px] text-muted-foreground">(Including all taxes)</span>
              </div>
              <span className="text-xl font-bold text-foreground">{formatPrice(totalPrice)}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={placing || !resolvedAddressId}
            >
              {placing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Placing order...
                </>
              ) : paymentMethod === 'cod' ? (
                'Place Order'
              ) : (
                `Pay ${formatPrice(totalPrice)}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
