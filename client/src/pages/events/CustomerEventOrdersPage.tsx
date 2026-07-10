import { Link } from 'react-router'
import {
  ShoppingBag,
  Download,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useCustomerEventOrders } from '@/hooks'
import apiClient from '@/api/apiClient'
import toast from 'react-hot-toast'
import type { EventOrder } from '@/types'

export default function CustomerEventOrdersPage() {
  const { data: orders, isLoading } = useCustomerEventOrders()

  const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
    try {
      toast.loading('Preparing invoice PDF...', { id: 'inv-download' })
      const response = await apiClient.get<Blob>(`/events/orders/${orderId}/invoice`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Invoice-${orderNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      toast.success('Invoice downloaded successfully', { id: 'inv-download' })
    } catch {
      toast.error('Could not download invoice.', { id: 'inv-download' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="text-center sm:text-left space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">My Event Orders</h1>
        <p className="text-xs text-muted-foreground">
          View your virtual event kit purchases, shipping statuses, and download official invoices.
        </p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-16 bg-muted/10 border border-dashed border-border rounded-xl space-y-4">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <div>
            <h3 className="text-sm font-bold text-foreground">No Event Orders placed yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Once you verify your Team ID on an Event page and complete checkout, your order will appear here.
            </p>
          </div>
          <Button asChild className="text-xs">
            <Link to="/events">Browse Events</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: EventOrder) => {
            const eventInfo = order.event && typeof order.event === 'object' ? (order.event as any) : null

            return (
              <Card key={order._id} className="overflow-hidden border border-border">
                {/* Order Top Banner */}
                <CardHeader className="bg-muted/30 p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-muted-foreground font-semibold">
                    <div>
                      Order ID: <span className="font-bold text-foreground font-mono">{order.orderId}</span>
                    </div>
                    <div>
                      Date: <span className="font-bold text-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                      </span>
                    </div>
                    <div>
                      Method: <span className="font-bold text-foreground uppercase">{order.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${
                        order.paymentStatus === 'paid'
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {order.paymentStatus === 'paid' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {order.paymentStatus}
                    </span>
                    <span className="capitalize bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                      {order.deliveryStatus}
                    </span>
                  </div>
                </CardHeader>

                {/* Order Content */}
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                    {/* Left: Event Info */}
                    <div className="flex gap-4">
                      {eventInfo?.banner?.url ? (
                        <img
                          src={eventInfo.banner.url}
                          alt={eventInfo.eventName}
                          className="h-16 w-16 object-cover rounded-lg border border-border shrink-0 bg-muted"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-muted flex items-center justify-center text-muted-foreground/30 font-mono text-[9px] border border-border shrink-0 rounded-lg">
                          EVENT
                        </div>
                      )}
                      <div className="min-w-0 text-xs">
                        <h4 className="font-bold text-foreground text-sm line-clamp-1">
                          {eventInfo?.eventName || 'Short Circuit College Event'}
                        </h4>
                        <p className="text-muted-foreground mt-0.5">{eventInfo?.organizationName}</p>
                        <p className="text-muted-foreground mt-0.5 truncate">{eventInfo?.collegeName}</p>
                        <div className="flex items-center gap-2 mt-2 bg-muted/40 border border-border rounded px-2 py-1 w-fit font-medium text-[10px] text-foreground">
                          <span>Team: <strong className="uppercase">{order.teamId}</strong></span>
                          <span className="text-muted-foreground">|</span>
                          <span>Leader: {order.leaderName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions and pricing */}
                    <div className="w-full sm:w-auto text-right space-y-2.5 sm:self-center shrink-0">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">Total Paid Amount</p>
                        <p className="text-lg font-extrabold text-primary">₹{order.priceBreakdown.totalPrice}</p>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        {order.invoiceId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(order._id, order.orderId)}
                            className="text-xs font-semibold h-8"
                          >
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Invoice
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Invoice processing...</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Tracker */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground max-w-lg">
                      <div className="flex flex-col items-center gap-1">
                        <div className="h-6 w-6 rounded-full bg-success/15 text-success flex items-center justify-center font-bold">
                          1
                        </div>
                        <span>Placed</span>
                      </div>
                      <div className="h-0.5 bg-border flex-1 mx-2" />
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center font-bold ${
                            ['packed', 'shipped', 'delivered'].includes(order.deliveryStatus)
                              ? 'bg-success/15 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          2
                        </div>
                        <span>Packed</span>
                      </div>
                      <div className="h-0.5 bg-border flex-1 mx-2" />
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center font-bold ${
                            ['shipped', 'delivered'].includes(order.deliveryStatus)
                              ? 'bg-success/15 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          3
                        </div>
                        <span>Shipped</span>
                      </div>
                      <div className="h-0.5 bg-border flex-1 mx-2" />
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center font-bold ${
                            order.deliveryStatus === 'delivered'
                              ? 'bg-success/15 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          4
                        </div>
                        <span>Delivered</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
