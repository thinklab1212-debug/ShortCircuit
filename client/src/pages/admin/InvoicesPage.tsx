// ============================================================================
// ElectroKart — Invoices Management Page (Admin)
// ============================================================================
// Lists invoices generated for customer purchases, displaying billing details
// and triggering downloads directly for company filing or auditing.
// ============================================================================

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { FileText, Download, Calendar, Search, ArrowRight } from 'lucide-react'
import { orderApi } from '@/services'
import { AdminPageHeader } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErrorFallback } from '@/components/ui/error'
import { Skeleton } from '@/components/ui/loader'
import { formatPrice, formatDate, getUserName } from '@/utils'
import { toast } from 'sonner'
import type { Order, User } from '@/types'

export default function InvoicesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Fetch all orders (with pagination and optional search filter)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'orders', 'invoices', page, search],
    queryFn: () =>
      orderApi
        .getAll({
          page,
          limit: 20,
          search: search.trim() || undefined,
        })
        .then((res) => res.data),
  })

  const handleDownload = async (orderId: string, orderNumber: string) => {
    setDownloadingId(orderId)
    try {
      const response = await orderApi.getInvoice(orderId)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Invoice-${orderNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`Invoice for order #${orderNumber} downloaded successfully`)
    } catch {
      toast.error('Failed to download invoice. Check if order status is delivered and paid.')
    } finally {
      setDownloadingId(null)
    }
  }

  if (isError) {
    return <ErrorFallback error={error as Error} resetErrorBoundary={() => void refetch()} />
  }

  const orders: Order[] = data?.data ?? []
  const pagination = data?.pagination

  // Filter orders that are eligible for invoices (delivered and paid) or already have an invoice number
  const invoiceOrders = orders.filter(
    (order) => order.invoiceNumber || (order.orderStatus === 'delivered' && order.paymentStatus === 'paid')
  )

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Company Invoice Log"
        description="View, audit, and download invoice copies generated for completed customer orders."
      />

      {/* Search Filter */}
      <div className="flex max-w-md items-center gap-2 rounded-xl border border-border bg-card px-3 py-1">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by Order ID or User name..."
          className="border-0 bg-transparent p-1 focus:ring-0 focus:outline-none"
        />
      </div>

      {/* List Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : invoiceOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search.trim() ? 'No matching orders with invoices found.' : 'No invoices generated yet. Invoices appear when orders are paid and delivered.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Invoice Number</th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3 hidden sm:table-cell">Customer</th>
                <th className="px-4 py-3 hidden md:table-cell">Completed Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoiceOrders.map((order) => {
                const customer = typeof order.user === 'string' ? null : (order.user as User)
                const completedDate = order.deliveredAt || order.updatedAt
                return (
                  <tr key={order._id} className="transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-foreground">
                      {order.invoiceNumber || 'Auto-Generates'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <Link to={`/admin/orders/${order._id}`} className="hover:text-primary transition-colors">
                        {order.orderId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm text-foreground">
                      {customer ? getUserName(customer) : 'Guest'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {completedDate ? formatDate(completedDate) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">
                      {formatPrice(order.totalPrice)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={downloadingId === order._id}
                          onClick={() => handleDownload(order._id, order.orderId)}
                          leftIcon={<Download />}
                        >
                          Download
                        </Button>
                        <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
                          <Link to={`/admin/orders/${order._id}`} title="View Order">
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevPage}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNextPage}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
