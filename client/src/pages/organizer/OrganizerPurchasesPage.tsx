import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  ArrowLeft,
  Search,
  CheckCircle,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPageHeader } from '@/components/admin'
import { useOrganizerEventPurchases, useEventDetail } from '@/hooks'
import apiClient from '@/api/apiClient'
import toast from 'react-hot-toast'
import type { EventOrder } from '@/types'

export default function OrganizerPurchasesPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [activeStatusTab, setActiveStatusTab] = useState<string>('') // '' means all
  const [page, setPage] = useState(1)

  // Fetch event details (for heading)
  const { data: event, isLoading: loadingEvent } = useEventDetail(id || '')

  // Fetch event purchases
  const { data, isLoading: loadingPurchases } = useOrganizerEventPurchases(id || '', {
    page,
    limit: 10,
    search: search.trim() || undefined,
    paymentStatus: activeStatusTab || undefined,
  })

  const purchases = data?.purchases || []
  const pagination = data?.pagination

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
        title="Event Kit Purchases"
        description={`Track kit orders and payment statuses for event: ${event?.eventName}`}
        action={
          <Button variant="outline" onClick={() => navigate(`/organizer/events/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event Details
          </Button>
        }
      />

      {/* Control bar: search, tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-border p-4 rounded-xl shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Team ID, Leader, Order ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9 text-xs"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex border border-border rounded-lg overflow-hidden text-xs shrink-0 self-end sm:self-auto bg-card">
          {(['', 'paid', 'pending', 'refunded'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveStatusTab(tab)
                setPage(1)
              }}
              className={`px-3 py-1.5 font-semibold capitalize border-r border-border last:border-r-0 transition-colors ${
                activeStatusTab === tab ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted/10'
              }`}
            >
              {tab === '' ? 'All Status' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid / Table list */}
      {loadingPurchases ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-16 bg-muted/5 border border-dashed border-border rounded-xl">
          <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2.5" />
          <h3 className="text-sm font-bold text-foreground">No purchases found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No registered teams have completed a hardware kit purchase for this event yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl bg-card">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold">
                <th className="p-3 text-xs">Order ID</th>
                <th className="p-3 text-xs">Team ID</th>
                <th className="p-3 text-xs">Leader Name</th>
                <th className="p-3 text-xs">Customer Name</th>
                <th className="p-3 text-xs">Purchase Date</th>
                <th className="p-3 text-xs">Payment</th>
                <th className="p-3 text-xs">Delivery</th>
                <th className="p-3 text-xs text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchases.map((order: EventOrder) => {
                const customerName = order.customer && typeof order.customer === 'object'
                  ? `${(order.customer as any).firstName} ${(order.customer as any).lastName}`
                  : 'Customer'

                return (
                  <tr key={order._id} className="hover:bg-muted/5 transition-colors text-xs text-foreground">
                    <td className="p-3 font-semibold font-mono text-primary">{order.orderId}</td>
                    <td className="p-3 font-bold uppercase">{order.teamId}</td>
                    <td className="p-3">{order.leaderName}</td>
                    <td className="p-3">
                      <p className="font-semibold">{customerName}</p>
                      <p className="text-[10px] text-muted-foreground">{(order.customer as any)?.email}</p>
                    </td>
                    <td className="p-3">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          order.paymentStatus === 'paid'
                            ? 'bg-success/10 text-success'
                            : order.paymentStatus === 'pending'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {order.paymentStatus === 'paid' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="capitalize bg-muted px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground">
                        {order.deliveryStatus}
                      </span>
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
