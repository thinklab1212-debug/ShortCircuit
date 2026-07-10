import { useState, useEffect } from 'react'
import { useParams, useNavigate, useBlocker } from 'react-router'
import {
  ArrowLeft,
  Search,
  Package,
  Plus,
  Minus,
  Trash2,
  Save,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AdminPageHeader } from '@/components/admin'
import { useEventDetail, useUpdateEvent, useProducts } from '@/hooks'
import type { EventKitProduct, Product } from '@/types'
import toast from 'react-hot-toast'

export default function KitBuilderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: event, isLoading: loadingEvent } = useEventDetail(id || '')
  const updateEvent = useUpdateEvent()

  // Local state for the event kit products list
  const [kitItems, setKitItems] = useState<EventKitProduct[]>([])
  // Local state for Event Kit Selling Price
  const [sellingPrice, setSellingPrice] = useState<number>(0)
  // Search query
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Load existing kit items and price on mount/load
  useEffect(() => {
    if (event) {
      setKitItems(
        event.kitProducts.map((p) => ({
          product: typeof p.product === 'string' ? p.product : (p.product as any)._id,
          productName: p.productName,
          productSku: p.productSku || '',
          productImage: p.productImage,
          priceAtCreation: p.priceAtCreation,
          quantity: p.quantity,
        }))
      )
      setSellingPrice(event.eventKitPrice)
    }
  }, [event])

  // Fetch products matching search query
  const { data: productsData, isLoading: loadingProducts } = useProducts({
    search: debouncedQuery || undefined,
    limit: 10,
    page: 1,
  })
  const searchResults = productsData?.data || []

  // Add a product to the kit
  const handleAddProduct = (product: Product) => {
    const price = product.effectivePrice ?? product.price
    const image = product.images?.[0]?.url || ''

    setKitItems((prev) => {
      const existing = prev.find((item) => item.product === product._id)
      if (existing) {
        toast.success(`Increased ${product.name} quantity to ${existing.quantity + 1}`)
        return prev.map((item) =>
          item.product === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      toast.success(`Added ${product.name} to kit`)
      return [
        ...prev,
        {
          product: product._id,
          productName: product.name,
          productSku: product.sku,
          productImage: image,
          priceAtCreation: price,
          quantity: 1,
        },
      ]
    })
  }

  // Update quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setKitItems((prev) =>
      prev.map((item) => {
        if (item.product === productId) {
          const newQty = Math.max(1, Math.min(100, item.quantity + delta))
          return { ...item, quantity: newQty }
        }
        return item
      })
    )
  }

  // Remove product
  const handleRemoveProduct = (productId: string) => {
    setKitItems((prev) => prev.filter((item) => item.product !== productId))
    toast.error('Removed item from kit')
  }

  // Live calculations
  const uniqueProductsCount = kitItems.length
  const totalQuantity = kitItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalKitValue = kitItems.reduce(
    (sum, item) => sum + item.priceAtCreation * item.quantity,
    0
  )
  const discount = Math.max(0, totalKitValue - sellingPrice)
  const discountPct =
    totalKitValue > 0
      ? Math.max(0, Math.round((discount / totalKitValue) * 10000) / 100)
      : 0

  // ─── Unsaved Changes Warning Logic ──────────────────────────────────────────

  // Determine if the local state differs from the loaded database values
  const isDirty = event ? (
    JSON.stringify(event.kitProducts.map(p => ({
      product: typeof p.product === 'string' ? p.product : (p.product as any)._id,
      productName: p.productName,
      productSku: p.productSku || '',
      productImage: p.productImage,
      priceAtCreation: p.priceAtCreation,
      quantity: p.quantity,
    }))) !== JSON.stringify(kitItems) ||
    event.eventKitPrice !== sellingPrice
  ) : false

  // Warn on browser reload/tab close
  useEffect(() => {
    if (!isDirty) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty])

  // Warn on in-app React Router transitions
  const blocker = useBlocker(() => {
    if (updateEvent.isPending) return false
    return isDirty
  })

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmLeave = window.confirm(
        'You have unsaved changes in your event kit. Are you sure you want to leave?'
      )
      if (confirmLeave) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])

  const handleSave = () => {
    if (!id) return
    updateEvent.mutate(
      {
        id,
        data: {
          eventKitPrice: sellingPrice,
          kitProducts: kitItems.map((item) => ({
            product: item.product as string,
            productName: item.productName,
            productSku: item.productSku,
            productImage: item.productImage,
            priceAtCreation: item.priceAtCreation,
            quantity: item.quantity,
          })),
        },
      },
      {
        onSuccess: () => {
          navigate(`/organizer/events/${id}`)
        },
      }
    )
  }

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Virtual Event Kit Builder"
        description={`Configure virtual bundle items for: ${event?.eventName}`}
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Product Search + Kit Items list */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Product Search Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                Browse & Add Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, brand, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Search Results list */}
              {loadingProducts ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No products found.
                </p>
              ) : searchQuery ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
                  {searchResults.map((product) => {
                    const price = product.effectivePrice ?? product.price
                    return (
                      <div
                        key={product._id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0]?.url || '/placeholder.png'}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover bg-muted shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-foreground line-clamp-1">
                              {product.name}
                            </h4>
                            <p className="text-[10px] text-muted-foreground">SKU: {product.sku}</p>
                            <p className="text-xs font-medium text-foreground mt-0.5">
                              ₹{price}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddProduct(product)}
                          className="h-8 text-xs px-2.5 shrink-0"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-1">
                  Type a product name or SKU in the search input above to add items to your Virtual Bundle.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 2. Current Kit Items Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Virtual Kit Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {kitItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Your Virtual Kit is empty</p>
                  <p className="text-xs mt-1">Search and add products from the catalogue above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {kitItems.map((item) => (
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
                          <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                            {item.productName}
                          </h4>
                          <p className="text-[10px] text-muted-foreground">SKU: {item.productSku}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Unit Price: ₹{item.priceAtCreation}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-border rounded-lg bg-muted/40">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.product as string, -1)}
                            className="p-1 px-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold px-1.5 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.product as string, 1)}
                            className="p-1 px-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right min-w-[80px]">
                          <p className="text-xs text-muted-foreground">Line Total</p>
                          <p className="text-sm font-bold text-foreground">
                            ₹{item.priceAtCreation * item.quantity}
                          </p>
                        </div>

                        {/* Remove Action */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProduct(item.product as string)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Live Pricing Panel / Save */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Live Kit Summary & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Unique Products</span>
                  <span className="font-semibold text-foreground">{uniqueProductsCount}</span>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total Quantity</span>
                  <span className="font-semibold text-foreground">{totalQuantity}</span>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total Kit Value</span>
                  <span className="font-semibold text-foreground">₹{totalKitValue}</span>
                </div>

                <div className="flex justify-between text-sm text-success font-medium">
                  <span>Special Event Discount</span>
                  <span>
                    -₹{discount} ({discountPct}% off)
                  </span>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground font-semibold">
                  <span>Final Amount to Pay</span>
                  <span className="text-foreground">₹{sellingPrice}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label
                  htmlFor="sellingPriceInput"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Event Kit Selling Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
                    ₹
                  </span>
                  <Input
                    id="sellingPriceInput"
                    type="number"
                    min={0}
                    placeholder="e.g. 999"
                    className="pl-7 font-bold text-foreground"
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  The discounted price students pay for this kit. Auto-recomputes discount.
                </p>
              </div>

              {isDirty && (
                <div className="rounded-lg bg-warning/10 p-3 text-xs text-warning border border-warning/20">
                  You have unsaved changes. Remember to save before navigating away.
                </div>
              )}

              <Separator />

              <Button
                className="w-full"
                onClick={handleSave}
                loading={updateEvent.isPending}
                loadingText="Saving Kit..."
              >
                <Save className="h-4 w-4 mr-2" />
                Save Event Kit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
