import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Eye,
  Trash2,
  X,
  Search,
  Boxes,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  FileText,
  Send,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { bulkOrderApi } from '@/services'
import { DataTable, AdminPageHeader } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader } from '@/components/ui/loader'
import { ErrorFallback } from '@/components/ui/error'
import { modalOverlayVariants, modalContentVariants } from '@/config/animations'
import type { BulkOrderQuote, BulkOrderStatus } from '@/types'

const STATUSES: ('All' | BulkOrderStatus)[] = [
  'All',
  'New',
  'Under Review',
  'Quote Sent',
  'Completed',
  'Cancelled',
]

const statusStyles: Record<BulkOrderStatus, string> = {
  New: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'Under Review': 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'Quote Sent': 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  Completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  Cancelled: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
}

export default function BulkOrdersAdminPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'All' | BulkOrderStatus>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<BulkOrderQuote | null>(null)

  // Edit form state inside modal
  const [editStatus, setEditStatus] = useState<BulkOrderStatus>('New')
  const [editAdminNotes, setEditAdminNotes] = useState('')
  const [editQuotedAmount, setEditQuotedAmount] = useState<number | ''>('')

  // Fetch Quotes
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'bulk-orders', statusFilter, searchQuery],
    queryFn: async () => {
      const res = await bulkOrderApi.getAdminQuotes({
        status: statusFilter === 'All' ? undefined : statusFilter,
        search: searchQuery || undefined,
        limit: 50,
      })
      return res.data
    },
  })

  // Fetch Stats
  const { data: statsData } = useQuery({
    queryKey: ['admin', 'bulk-orders-stats'],
    queryFn: async () => {
      const res = await bulkOrderApi.getAdminStats()
      return res.data?.data
    },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'bulk-orders'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'bulk-orders-stats'] })
  }

  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      adminNotes,
      quotedAmount,
    }: {
      id: string
      status: BulkOrderStatus
      adminNotes?: string
      quotedAmount?: number
    }) => bulkOrderApi.updateQuoteStatus(id, { status, adminNotes, quotedAmount }),
    onSuccess: (res) => {
      toast.success('Quotation updated successfully')
      invalidate()
      if (selectedQuote?._id === res.data.data._id) {
        setSelectedQuote(res.data.data)
      }
    },
    onError: () => toast.error('Failed to update quotation'),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => bulkOrderApi.deleteQuote(id),
    onSuccess: () => {
      toast.success('Quotation request deleted')
      invalidate()
      if (selectedQuote) setSelectedQuote(null)
    },
    onError: () => toast.error('Failed to delete quotation'),
  })

  const handleDelete = (quote: BulkOrderQuote) => {
    if (
      window.confirm(
        `Are you sure you want to delete quote "${quote.quoteNumber}" from ${quote.customer.name}?`
      )
    ) {
      deleteMutation.mutate(quote._id)
    }
  }

  // Open modal and initialize edit state
  const handleOpenDetail = (quote: BulkOrderQuote) => {
    setSelectedQuote(quote)
    setEditStatus(quote.status)
    setEditAdminNotes(quote.adminNotes || '')
    setEditQuotedAmount(quote.quotedAmount !== undefined ? quote.quotedAmount : '')
  }

  const handleSaveModal = () => {
    if (!selectedQuote) return
    updateStatusMutation.mutate({
      id: selectedQuote._id,
      status: editStatus,
      adminNotes: editAdminNotes.trim() || undefined,
      quotedAmount:
        editQuotedAmount !== '' && !isNaN(Number(editQuotedAmount))
          ? Number(editQuotedAmount)
          : undefined,
    })
  }

  // Compose pre-filled email body for manual response
  const mailtoHref = useMemo(() => {
    if (!selectedQuote) return ''
    const subject = encodeURIComponent(
      `Short Circuit Quotation for Bulk Order ${selectedQuote.quoteNumber}`
    )
    const itemsText = selectedQuote.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.productName} - Qty: ${it.quantity}${
            it.targetPrice ? ` (Target: ₹${it.targetPrice})` : ''
          }${it.notes ? ` [Note: ${it.notes}]` : ''}`
      )
      .join('\n')

    const body = encodeURIComponent(
      `Hi ${selectedQuote.customer.name},\n\nThank you for reaching out to Short Circuit for your bulk component requirements.\n\nWe have reviewed your request [Ref: ${selectedQuote.quoteNumber}] for the following items:\n${itemsText}\n\n--- OFFICIAL QUOTATION ---\nTotal Quoted Amount: ₹${
        editQuotedAmount || ''
      }\nGST: 18% Inclusive / Applicable as per HSN\nEstimated Dispatch Time: \nCourier / Transport: \nPayment Terms: 100% advance / Institutional PO\n\nPlease reply to this email or contact us to confirm the order and arrange billing.\n\nWarm regards,\nSales & Procurement Team\nShort Circuit Electronics\nsales.shortcircuit@gmail.com`
    )

    return `mailto:${selectedQuote.customer.email}?subject=${subject}&body=${body}`
  }, [selectedQuote, editQuotedAmount])

  const columns = [
    {
      key: 'quoteNumber',
      header: 'Quote #',
      render: (row: BulkOrderQuote) => (
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={() => handleOpenDetail(row)}
            className="font-mono font-bold text-primary hover:underline text-xs block text-left"
          >
            {row.quoteNumber}
          </button>
          <span className="text-[11px] text-muted-foreground block">
            {new Date(row.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer & Org',
      render: (row: BulkOrderQuote) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-semibold text-foreground block">{row.customer.name}</span>
          {row.customer.organization && (
            <span className="text-muted-foreground block truncate max-w-[180px]">
              {row.customer.organization}
            </span>
          )}
          {(row.customer.city || row.customer.pincode) && (
            <span className="text-[11px] text-muted-foreground block">
              {[row.customer.city, row.customer.pincode].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row: BulkOrderQuote) => (
        <div className="space-y-0.5 text-xs">
          <a
            href={`mailto:${row.customer.email}`}
            className="text-primary hover:underline block truncate max-w-[180px]"
          >
            {row.customer.email}
          </a>
          <a href={`tel:${row.customer.phone}`} className="text-muted-foreground font-mono block">
            {row.customer.phone}
          </a>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Requested Items',
      render: (row: BulkOrderQuote) => {
        const firstItem = row.items[0]
        return (
          <div className="space-y-0.5 text-xs max-w-[220px]">
            <span className="font-medium text-foreground truncate block">
              {firstItem?.productName || 'No items'} (x{firstItem?.quantity})
            </span>
            {row.items.length > 1 && (
              <span className="text-[11px] text-primary font-medium block">
                +{row.items.length - 1} more {row.items.length - 1 === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: BulkOrderQuote) => (
        <select
          value={row.status}
          onChange={(e) =>
            updateStatusMutation.mutate({
              id: row._id,
              status: e.target.value as BulkOrderStatus,
            })
          }
          className={`h-7 px-2 text-xs font-semibold rounded-md border focus:outline-none cursor-pointer ${
            statusStyles[row.status]
          }`}
        >
          {STATUSES.filter((s): s is BulkOrderStatus => s !== 'All').map((st) => (
            <option key={st} value={st} className="bg-popover text-popover-foreground">
              {st}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row: BulkOrderQuote) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleOpenDetail(row)}
            aria-label="View Details"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(row)}
            aria-label="Delete"
            title="Delete"
            className="text-error-500 hover:text-error-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (isLoading) return <Loader fullScreen text="Loading bulk orders..." />
  if (isError) return <ErrorFallback error={error as Error} resetErrorBoundary={refetch} />

  const quotes = data?.data || []

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bulk Order Quotations (RFQ)"
        description="Review incoming wholesale, college lab, and institutional hardware quotation requests."
      />

      {/* Summary Cards */}
      {statsData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-border bg-card p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Total Inquiries</span>
            <div className="text-2xl font-bold text-foreground">{statsData.total}</div>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              New / Pending
            </span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {statsData.new}
            </div>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-1">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Under Review
            </span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statsData.underReview}
            </div>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-1">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
              Quotes Sent
            </span>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {statsData.quoteSent}
            </div>
          </div>
        </div>
      )}

      {/* Controls: Search + Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border sm:border-0">
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {status}
              {status === 'New' && statsData?.new ? (
                <span className="ml-1.5 rounded-full bg-amber-500 text-white text-[10px] px-1.5 py-0.2">
                  {statsData.new}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search quote, name, item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns as never}
        data={(quotes ?? []) as never}
        isLoading={isLoading}
        emptyMessage={`No ${statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} quotation inquiries found.`}
      />

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedQuote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              variants={modalOverlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setSelectedQuote(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl z-10 overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Boxes className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-foreground">
                        {selectedQuote.quoteNumber}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          statusStyles[selectedQuote.status]
                        }`}
                      >
                        {selectedQuote.status}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" /> Submitted on{' '}
                      {new Date(selectedQuote.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedQuote(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* Customer Details Card */}
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Customer Name</span>
                      <span className="font-semibold text-foreground block text-sm">
                        {selectedQuote.customer.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">
                        Organization / College
                      </span>
                      <span className="font-medium text-foreground block">
                        {selectedQuote.customer.organization || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Email</span>
                      <a
                        href={`mailto:${selectedQuote.customer.email}`}
                        className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" /> {selectedQuote.customer.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Phone</span>
                      <a
                        href={`tel:${selectedQuote.customer.phone}`}
                        className="text-foreground hover:underline font-mono font-medium inline-flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3 text-muted-foreground" />{' '}
                        {selectedQuote.customer.phone}
                      </a>
                    </div>
                    {(selectedQuote.customer.city || selectedQuote.customer.pincode) && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground block text-[11px]">Location</span>
                        <span className="text-foreground">
                          {[selectedQuote.customer.city, selectedQuote.customer.pincode]
                            .filter(Boolean)
                            .join(' — Pincode: ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Requested Products Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Requested Products ({selectedQuote.items.length} items)</span>
                  </h4>

                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b border-border text-muted-foreground text-[11px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-8">#</th>
                          <th className="py-2.5 px-3 text-left">Product / Description</th>
                          <th className="py-2.5 px-3 text-center w-16">Qty</th>
                          <th className="py-2.5 px-3 text-right w-24">Target (₹)</th>
                          <th className="py-2.5 px-3 text-left">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedQuote.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-foreground">
                              {it.productName}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-primary font-mono">
                              {it.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                              {it.targetPrice ? `₹${it.targetPrice}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                              {it.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Customer Notes */}
                {selectedQuote.notes && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Customer Project / General Notes
                    </h4>
                    <div className="rounded-xl border border-border bg-muted/20 p-3.5 text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedQuote.notes}
                    </div>
                  </div>
                )}

                {/* Admin Management & Manual Emailing */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center justify-between">
                    <span>Admin Quotation Controls</span>
                    <a
                      href={mailtoHref}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      title="Prepares quotation email draft in your default email client"
                    >
                      <Mail className="h-3.5 w-3.5" /> Manual Reply via Email &rarr;
                    </a>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        Quotation Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as BulkOrderStatus)}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none"
                      >
                        {STATUSES.filter((s): s is BulkOrderStatus => s !== 'All').map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        Quoted Amount (₹ Total)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="e.g. 15400"
                        value={editQuotedAmount}
                        onChange={(e) =>
                          setEditQuotedAmount(
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                      Internal Admin Notes (Private)
                    </label>
                    <Textarea
                      placeholder="e.g. Quoted ₹15,400 via email on 17 Sep. Awaiting college purchase order."
                      rows={2}
                      value={editAdminNotes}
                      onChange={(e) => setEditAdminNotes(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={mailtoHref}
                      className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" /> Open Email Client with Quote Draft
                    </a>

                    <Button
                      size="sm"
                      onClick={handleSaveModal}
                      isLoading={updateStatusMutation.isPending}
                    >
                      Save Status & Notes
                    </Button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-border px-5 py-3 bg-muted/20 flex items-center justify-between shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(selectedQuote)}
                  className="text-error-500 hover:text-error-600 hover:bg-error-500/10 text-xs"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Delete Quote
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedQuote(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
