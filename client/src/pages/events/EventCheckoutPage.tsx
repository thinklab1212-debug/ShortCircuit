import { useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router'
import {
  ArrowLeft,
  CreditCard,
  Truck,
  ShieldCheck,
  Package,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useEventCheckout, useAddresses, usePurchaseEventKit } from '@/hooks'
import toast from 'react-hot-toast'
import type { Address } from '@/types'

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

export default function EventCheckoutPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // Token is read only from React state memory (passed via Router state)
  const token = location.state?.token || ''

  const { data: checkoutData, isLoading: checkoutLoading, error: checkoutError } = useEventCheckout(id || '', token)
  const { data: addresses, isLoading: addressesLoading } = useAddresses()
  const purchaseMutation = usePurchaseEventKit()

  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay')
  const [placing, setPlacing] = useState(false)

  // Resolve selected address
  const resolvedAddressId = useMemo(() => {
    if (selectedAddressId) return selectedAddressId
    if (!addresses || addresses.length === 0) return ''
    const def = addresses.find((a) => a.isDefault)
    return def?._id ?? addresses[0]._id
  }, [selectedAddressId, addresses])

  const handlePlaceOrder = async () => {
    if (!id || !token) {
      toast.error('Session expired. Please re-verify your team.')
      return
    }
    if (!resolvedAddressId) {
      toast.error('Please select a shipping address.')
      return
    }

    setPlacing(true)
    try {
      if (paymentMethod === 'cod') {
        await purchaseMutation.mutateAsync({
          eventId: id,
          verificationToken: token,
          addressId: resolvedAddressId,
          paymentMethod: 'cod',
        })
        toast.success('Event Order placed successfully via COD!')
        navigate('/profile/event-orders')
        return
      }

      // Razorpay payment flow
      const result = await purchaseMutation.mutateAsync({
        eventId: id,
        verificationToken: token,
        addressId: resolvedAddressId,
        paymentMethod: 'razorpay',
      })

      const rz = result.razorpayOrder
      const order = result.order

      const loaded = await loadRazorpayScript()
      if (!loaded || !window.Razorpay) {
        toast.error('Failed to load payment gateway. Please try again.')
        setPlacing(false)
        return
      }

      const rzp = new window.Razorpay({
        key: rz.keyId,
        order_id: rz.id,
        amount: rz.amount,
        currency: rz.currency,
        name: 'Short Circuit Kits',
        description: `Kit Purchase - ${checkoutData?.event?.eventName}`,
        handler: async (resp: {
          razorpay_payment_id: string
          razorpay_signature: string
          razorpay_order_id: string
        }) => {
          try {
            setPlacing(true)
            await purchaseMutation.mutateAsync({
              eventId: id,
              verificationToken: token,
              addressId: resolvedAddressId,
              paymentMethod: 'razorpay',
              orderId: order._id,
              paymentDetails: {
                razorpayOrderId: resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              },
            })
            toast.success('Payment successful! Order placed.')
            navigate('/profile/event-orders')
          } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Payment signature verification failed.')
          } finally {
            setPlacing(false)
          }
        },
        modal: {
          ondismiss: () => {
            setPlacing(false)
            toast.error('Payment cancelled.')
          },
        },
      })

      rzp.open()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to place order.')
      setPlacing(false)
    }
  }

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md space-y-4">
        <AlertTriangle className="h-12 w-12 mx-auto text-warning" />
        <h3 className="text-lg font-bold text-foreground">Verification Token Missing</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          For security reasons, checkout sessions cannot be persisted. Please verify your eligibility with your Team ID again to proceed.
        </p>
        <Button asChild className="mt-2 text-xs">
          <Link to="/events">Back to Events catalog</Link>
        </Button>
      </div>
    )
  }

  if (checkoutLoading || addressesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (checkoutError || !checkoutData) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md space-y-4">
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
        <h3 className="text-lg font-bold text-foreground">Session Invalidated</h3>
        <p className="text-xs text-muted-foreground">
          {checkoutError?.message || 'Your verification session expired or is invalid. Please verify again.'}
        </p>
        <Button asChild className="mt-2 text-xs">
          <Link to="/events">Go back and Re-verify</Link>
        </Button>
      </div>
    )
  }

  const { event, teamId, leaderName, priceBreakdown, kitProducts } = checkoutData

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/events`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Abort Checkout
          </Link>
        </Button>
      </div>

      <div className="text-center sm:text-left space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Event Kit Checkout</h1>
        <p className="text-xs text-muted-foreground">
          Complete purchase for team <span className="font-bold text-foreground">{teamId}</span> (Leader: {leaderName})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Address and Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping address select */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-primary" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {(!addresses || addresses.length === 0) ? (
                <div className="text-center py-6 border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground">No saved addresses found.</p>
                  <Button asChild variant="link" size="sm" className="mt-1 text-xs">
                    <Link to="/addresses">Add New Address</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address: Address) => (
                    <label
                      key={address._id}
                      className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                        resolvedAddressId === address._id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:bg-muted/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shippingAddress"
                        checked={resolvedAddressId === address._id}
                        onChange={() => setSelectedAddressId(address._id)}
                        className="mt-1 accent-primary"
                      />
                      <div className="text-xs space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">{address.fullName}</span>
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase font-semibold text-muted-foreground">
                            {address.type}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed truncate">
                          {address.addressLine1}, {address.addressLine2 ? address.addressLine2 + ', ' : ''}
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="text-muted-foreground font-medium mt-1">Phone: {address.phone}</p>
                      </div>
                    </label>
                  ))}
                  <div className="pt-1.5 flex justify-end">
                    <Button asChild variant="outline" size="sm" className="text-xs">
                      <Link to="/addresses">Add New Address</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Select */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-primary" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Razorpay */}
                <label
                  className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:bg-muted/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="accent-primary"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-foreground">Razorpay (Cards/UPI/NetBanking)</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">Secure payment via Razorpay checkout</p>
                  </div>
                </label>

                {/* COD */}
                <label
                  className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:bg-muted/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-primary"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-foreground">Cash On Delivery (COD)</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">Pay on delivery (if eligible)</p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Summary, Totals & Checkout Trigger */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4.5 w-4.5 text-muted-foreground" />
                Kit Bundle Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Event Card preview */}
              <div className="flex gap-3">
                {event.banner?.url ? (
                  <img
                    src={event.banner.url}
                    alt={event.eventName}
                    className="h-16 w-16 object-cover rounded-lg border border-border shrink-0 bg-muted"
                  />
                ) : (
                  <div className="h-16 w-16 bg-muted flex items-center justify-center text-muted-foreground/30 font-mono text-[9px] border border-border shrink-0 rounded-lg">
                    EVENT
                  </div>
                )}
                <div className="min-w-0 text-xs">
                  <h4 className="font-bold text-foreground line-clamp-1">{event.eventName}</h4>
                  <p className="text-muted-foreground mt-0.5">{event.organizationName}</p>
                  <p className="text-muted-foreground mt-0.5 truncate">{event.collegeName}</p>
                </div>
              </div>

              <Separator />

              {/* Items List */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {kitProducts?.map((item: any) => (
                  <div key={item.product} className="flex justify-between text-xs items-center gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{item.productName}</p>
                      <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-foreground shrink-0">
                      ₹{item.priceAtCreation * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Pricing details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Value</span>
                  <span>₹{priceBreakdown.itemsPrice}</span>
                </div>
                <div className="flex justify-between text-success font-medium">
                  <span>Bundle Discount</span>
                  <span>-₹{priceBreakdown.discountAmount}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping Charges</span>
                  <span>
                    {priceBreakdown.shippingPrice === 0 ? 'FREE' : `₹${priceBreakdown.shippingPrice}`}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[10px]">
                  <span>GST (18% inclusive)</span>
                  <span>₹{priceBreakdown.taxPrice}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-extrabold text-foreground pt-1">
                  <span>Final Amount to Pay</span>
                  <span className="text-lg text-primary">₹{priceBreakdown.totalPrice}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Place order CTA */}
          <div className="space-y-3">
            <Button
              className="w-full text-xs font-semibold h-12"
              loading={placing}
              disabled={placing || !resolvedAddressId}
              onClick={handlePlaceOrder}
            >
              Confirm and Pay ₹{priceBreakdown.totalPrice}
            </Button>
            <div className="rounded-xl border border-muted bg-muted/20 p-3 flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
              <ShieldCheck className="h-4 w-4 shrink-0 text-success mt-0.5" />
              <span>
                By completing checkout, your team ID will be marked as registered and purchased. This transaction is guaranteed by safe payment encryption.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
