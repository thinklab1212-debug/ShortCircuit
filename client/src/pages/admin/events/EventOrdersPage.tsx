import { useState } from 'react'
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPageHeader } from '@/components/admin'
import { useAdminEventOrders } from '@/hooks'
import apiClient from '@/api/apiClient'
import toast from 'react-hot-toast'
import type { EventOrder } from '@/types'

export default function EventOrdersPage() {
  const [search, setSearch] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<string>('')
  const [deliveryStatus, setDeliveryStatus] = useState<string>('')
  const [page, setPage] = useState(1)

  const [selectedOrderForNote, setSelectedOrderForNote] = useState<{
    orderId: string
    orderNumber: string
    field: 'paymentStatus' | 'deliveryStatus'
    newValue: string
  } | null>(null)
  const [statusNote, setStatusNote] = useState('')
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false)

  const { data, isLoading } = useAdminEventOrders({
    page,
    limit: 10,
    paymentStatus: paymentStatus || undefined,
    deliveryStatus: deliveryStatus || undefined,
  })

  const orders = data?.orders || []
  const pagination = data?.pagination

  const openStatusModal = (
    orderId: string,
    orderNumber: string,
    field: 'paymentStatus' | 'deliveryStatus',
    newValue: string
  ) => {
    setSelectedOrderForNote({ orderId, orderNumber, field, newValue })
    setStatusNote('')
  }

  const handleConfirmUpdateStatus = async () => {
    if (!selectedOrderForNote) return
    setIsSubmittingStatus(true)
    try {
      toast.loading('Updating order status...', { id: 'status-update' })
      await apiClient.patch(`/admin/events/orders/${selectedOrderForNote.orderId}/status`, {
        [selectedOrderForNote.field]: selectedOrderForNote.newValue,
        note: statusNote.trim() || undefined,
      })
      toast.success('Order status updated successfully', { id: 'status-update' })
      setSelectedOrderForNote(null)
      setStatusNote('')
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch {
      toast.error('Failed to update status.', { id: 'status-update' })
    } finally {
      setIsSubmittingStatus(false)
    }
  }

  // Filter orders client side for search to give an exceptionally smooth response
  const filteredOrders = orders.filter((order) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      order.orderId.toLowerCase().includes(term) ||
      order.teamId.toLowerCase().includes(term) ||
      order.leaderName.toLowerCase().includes(term)
    );
  })

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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Event orders"
        description="Global read-only dashboard for all student hardware kit purchases across college events."
      />

      {/* Control filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card border border-border p-4 rounded-xl shadow-sm">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID, Team ID, Leader..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto justify-end">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />

          {/* Payment Status filter */}
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value)
              setPage(1)
            }}
            className="bg-card text-foreground border border-border rounded-lg text-xs p-2 focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          {/* Delivery Status filter */}
          <select
            value={deliveryStatus}
            onChange={(e) => {
              setDeliveryStatus(e.target.value)
              setPage(1)
            }}
            className="bg-card text-foreground border border-border rounded-lg text-xs p-2 focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="">All Deliveries</option>
            <option value="placed">Placed</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-muted/5 border border-dashed border-border rounded-xl">
          <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2.5" />
          <h3 className="text-sm font-bold text-foreground">No Event Orders Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            No matching event orders have been generated in the system yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl bg-card">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold">
                <th className="p-3 text-xs">Order ID</th>
                <th className="p-3 text-xs">Event Name</th>
                <th className="p-3 text-xs">Organizer</th>
                <th className="p-3 text-xs">Team Info</th>
                <th className="p-3 text-xs">Customer</th>
                <th className="p-3 text-xs">Purchase Date</th>
                <th className="p-3 text-xs">Payment</th>
                <th className="p-3 text-xs">Delivery</th>
                <th className="p-3 text-xs text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order: EventOrder) => {
                const eventName = order.event && typeof order.event === 'object'
                  ? (order.event as any).eventName
                  : 'Event'

                const organizerName = order.organizer && typeof order.organizer === 'object'
                  ? `${(order.organizer as any).firstName} ${(order.organizer as any).lastName}`
                  : 'Organizer'

                const customerName = order.customer && typeof order.customer === 'object'
                  ? `${(order.customer as any).firstName} ${(order.customer as any).lastName}`
                  : 'Customer'

                return (
                  <tr key={order._id} className="hover:bg-muted/5 transition-colors text-xs text-foreground">
                    <td className="p-3 font-semibold font-mono text-primary">{order.orderId}</td>
                    <td className="p-3 font-bold line-clamp-1 max-w-[150px]">{eventName}</td>
                    <td className="p-3 text-muted-foreground">{organizerName}</td>
                    <td className="p-3">
                      <p className="font-bold uppercase text-[10px]">{order.teamId}</p>
                      <p className="text-muted-foreground text-[10px]">Leader: {order.leaderName}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold">{customerName}</p>
                      <p className="text-[10px] text-muted-foreground">{(order.customer as any)?.email}</p>
                    </td>
                    <td className="p-3">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td className="p-3">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => openStatusModal(order._id, order.orderId, 'paymentStatus', e.target.value)}
                        className={`bg-card border border-border rounded text-[10px] p-1 font-semibold focus:ring-1 focus:ring-primary outline-none ${
                          order.paymentStatus === 'paid'
                            ? 'text-success border-success/30 bg-success/5'
                            : order.paymentStatus === 'pending'
                            ? 'text-warning border-warning/30 bg-warning/5'
                            : 'text-destructive border-destructive/30 bg-destructive/5'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        value={order.deliveryStatus}
                        onChange={(e) => openStatusModal(order._id, order.orderId, 'deliveryStatus', e.target.value)}
                        className="bg-card text-foreground border border-border rounded text-[10px] p-1 font-medium focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="placed">Placed</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      {order.invoiceId ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(order._id, order.orderId)}
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40 italic">N/A</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Update Note Modal */}
      {selectedOrderForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-foreground">
              Update {selectedOrderForNote.field === 'deliveryStatus' ? 'Delivery' : 'Payment'} Status
            </h3>
            <p className="text-xs text-muted-foreground">
              Order: <span className="font-mono font-semibold text-primary">{selectedOrderForNote.orderNumber}</span> · New Status:{' '}
              <span className="font-semibold capitalize text-foreground">{selectedOrderForNote.newValue}</span>
            </p>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Note (optional)
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Add a delivery note or update message visible to user..."
                className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrderForNote(null)}
                disabled={isSubmittingStatus}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmUpdateStatus}
                loading={isSubmittingStatus}
              >
                Save & Update Status
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-xs font-semibold text-muted-foreground px-3">
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
    </div>
  )
}
