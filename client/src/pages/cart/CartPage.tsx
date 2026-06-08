import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingCart, ShoppingBag, LogIn, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
  useCartTotals,
} from '@/hooks'
import { useAuthStore } from '@/store'
import { formatPrice, primaryImage } from '@/utils'
import { staggerContainer, fadeInUp } from '@/config/animations'
import type { CartItem } from '@/types'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CartRowSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="h-24 w-24 shrink-0 skeleton rounded-xl" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-3 w-24 skeleton rounded" />
        <div className="h-8 w-32 skeleton rounded" />
      </div>
      <div className="h-5 w-16 skeleton rounded" />
    </div>
  )
}

// ─── Cart Line Item ───────────────────────────────────────────────────────────

function CartLineItem({ item }: { item: CartItem }) {
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()

  const maxQty = Math.max(1, Math.min(item.product.stock || 10, 10))
  const lineTotal = item.price * item.quantity

  const setQuantity = (next: number) => {
    if (next < 1 || next > maxQty || next === item.quantity) return
    updateItem.mutate({ itemId: item._id, quantity: next })
  }

  return (
    <motion.div
      variants={fadeInUp}
      className="flex gap-4 rounded-2xl border border-border bg-card p-4"
    >
      {/* Image */}
      <Link
        to={`/product/${item.product.slug}`}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted/30"
      >
        <img
          src={primaryImage(item.product)}
          alt={item.product.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </Link>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          to={`/product/${item.product.slug}`}
          className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors"
        >
          {item.product.name}
        </Link>

        {item.variant && (
          <p className="text-xs text-muted-foreground">
            {item.variant.name}: <span className="font-medium">{item.variant.value}</span>
          </p>
        )}

        <p className="text-xs text-muted-foreground">{formatPrice(item.price)} each</p>

        {/* Quantity stepper + remove */}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
          <div className="flex items-center rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1 || updateItem.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-9 text-center text-sm font-medium tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(item.quantity + 1)}
              disabled={item.quantity >= maxQty || updateItem.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeItem.mutate(item._id)}
            disabled={removeItem.isPending}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-error-500 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="shrink-0 text-right">
        <span className="text-sm font-bold text-foreground">{formatPrice(lineTotal)}</span>
      </div>
    </motion.div>
  )
}

// ─── Cart Page ──────────────────────────────────────────────────────────────────

export default function CartPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: cart, isLoading } = useCart()
  const { data: totals } = useCartTotals()
  const clearCart = useClearCart()

  // ── Auth guard ──
  if (!isAuthenticated) {
    return (
      <div className="container py-16">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-xl font-semibold text-foreground">Sign in to view your cart</h1>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Log in to your account to see the items you've added and continue shopping.
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
  const isEmpty = !isLoading && items.length === 0

  // Use accurate server totals; fall back to cart.totalPrice while loading.
  const itemsPrice = totals?.itemsPrice ?? cart?.totalPrice ?? 0
  const shippingPrice = totals?.shippingPrice ?? 0
  const discountAmount = totals?.discountAmount ?? 0
  const totalPrice = totals?.totalPrice ?? cart?.totalPrice ?? 0

  return (
    <div className="container py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-display-xs sm:text-display-sm font-heading text-foreground">
            Shopping Cart
          </h1>
          {!isLoading && items.length > 0 && (
            <p className="mt-1 text-body-md text-muted-foreground">
              {cart?.totalItems ?? items.length} item(s) in your cart
            </p>
          )}
        </div>
        {!isLoading && items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearCart.mutate()}
            loading={clearCart.isPending}
            className="text-muted-foreground hover:text-error-500"
          >
            <Trash2 className="h-4 w-4" />
            Clear cart
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <CartRowSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {isEmpty && (
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Your cart is empty</h2>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Looks like you haven't added anything yet. Explore our latest electronics and gadgets.
          </p>
          <Button asChild>
            <Link to="/shop">
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Cart content */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Items list */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4 lg:col-span-2"
          >
            {items.map((item) => (
              <CartLineItem key={item._id} item={item} />
            ))}
          </motion.div>

          {/* Summary sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>

              <div className="mt-4 space-y-3 text-sm">
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

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-foreground">Total</span>
                  <span className="text-[10px] text-muted-foreground">(Including all taxes)</span>
                </div>
                <span className="text-xl font-bold text-foreground">{formatPrice(totalPrice)}</span>
              </div>

              <Button
                className="mt-6 w-full"
                size="lg"
                disabled={items.length === 0}
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button asChild variant="ghost" className="mt-2 w-full">
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
