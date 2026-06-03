import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck, Check, X, Upload, Loader2 } from 'lucide-react'
import { adminVendorApi } from '@/services/vendorApi'
import { uploadApi } from '@/services'
import { AdminPageHeader } from '@/components/admin'
import { ErrorFallback } from '@/components/ui/error'
import { Skeleton } from '@/components/ui/loader'
import { formatPrice, formatDate, getUserName } from '@/utils'
import { toast } from 'sonner'
import type { Product, User, ReviewProductData, ProductImage } from '@/types'

// ─── Admin Review Queue Page ────────────────────────────────────────────────────

type ModalState =
  | { type: 'approve'; product: Product }
  | { type: 'reject'; product: Product }
  | null

export default function ReviewQueuePage() {
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<ModalState>(null)
  const [approvePrice, setApprovePrice] = useState('')
  const [approveSalePrice, setApproveSalePrice] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [adminImages, setAdminImages] = useState<ProductImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [imageMergeMode, setImageMergeMode] = useState<'append' | 'replace'>('append')
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'review-queue', page],
    queryFn: () => adminVendorApi.getReviewQueue({ page, limit: 20 }).then((res) => res.data),
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewProductData }) =>
      adminVendorApi.reviewProduct(id, data),
    onSuccess: (_, variables) => {
      const action = variables.data.action === 'approve' ? 'approved' : 'rejected'
      toast.success(`Product ${action} successfully`)
      queryClient.invalidateQueries({ queryKey: ['admin', 'review-queue'] })
      setModal(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Review action failed')
    },
  })

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const res = await uploadApi.image(file)
        const { url, publicId } = res.data.data
        setAdminImages((prev) => [
          ...prev,
          { url, publicId, isPrimary: false },
        ])
      }
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeAdminImage = (publicId: string) => {
    setAdminImages((prev) => prev.filter((img) => img.publicId !== publicId))
  }

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault()
    if (!modal || modal.type !== 'approve') return
    if (uploading) {
      toast.error('Please wait for image uploads to complete')
      return
    }
    const price = parseFloat(approvePrice)
    if (!price || price <= 0) {
      toast.error('Please enter a valid selling price')
      return
    }
    const data: ReviewProductData = {
      action: 'approve',
      price,
      ...(approveSalePrice ? { salePrice: parseFloat(approveSalePrice) } : {}),
      images: adminImages.map((img) => img.url),
      imageMergeMode,
    }
    reviewMutation.mutate({ id: modal.product._id, data })
  }

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!modal || modal.type !== 'reject') return
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    reviewMutation.mutate({
      id: modal.product._id,
      data: { action: 'reject', reason: rejectReason },
    })
  }

  const openApproveModal = (product: Product) => {
    setApprovePrice(product.vendorPrice ? String(Math.ceil(product.vendorPrice * 1.3)) : '')
    setApproveSalePrice('')
    setAdminImages([])
    setUploading(false)
    setImageMergeMode('append')
    setModal({ type: 'approve', product })
  }

  const openRejectModal = (product: Product) => {
    setRejectReason('')
    setModal({ type: 'reject', product })
  }

  if (isError) {
    return <ErrorFallback error={error as Error} resetErrorBoundary={() => void refetch()} />
  }

  const products: Product[] = data?.data ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Product Review Queue"
        description="Review and approve vendor product submissions"
      />

      {/* Review Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            {modal.type === 'approve' ? (
              <>
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h2 className="text-lg font-semibold text-foreground">Approve Product</h2>
                  <button onClick={() => setModal(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleApprove} className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="text-sm font-medium text-foreground">{modal.product.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor Price</p>
                    <p className="text-sm font-semibold text-foreground">
                      {modal.product.vendorPrice != null ? formatPrice(modal.product.vendorPrice) : '—'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Selling Price (₹) *</label>
                    <input
                      type="number"
                      value={approvePrice}
                      onChange={(e) => setApprovePrice(e.target.value)}
                      required
                      min="0.01"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Customer-facing price"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Sale Price (₹)</label>
                    <input
                      type="number"
                      value={approveSalePrice}
                      onChange={(e) => setApproveSalePrice(e.target.value)}
                      min="0.01"
                      step="0.01"
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Optional discounted price"
                    />
                  </div>

                  {/* Vendor Images (Read-only) */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Vendor Images</label>
                    {modal.product.images && modal.product.images.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2 border border-border rounded-lg p-2 bg-muted/20">
                        {modal.product.images.map((img) => (
                          <div key={img.publicId} className="relative aspect-square rounded border border-border overflow-hidden bg-background">
                            <img src={img.url} alt={img.alt || ""} className="h-full w-full object-cover" />
                            {img.isPrimary && (
                              <span className="absolute bottom-0 left-0 right-0 bg-primary/85 text-[10px] text-primary-foreground text-center py-0.5 font-medium">Primary</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic px-1">No vendor images provided.</p>
                    )}
                  </div>

                  {/* Admin Image Upload Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground block">Admin Added Images</label>
                    <label
                      className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border p-4 text-center transition-colors hover:border-primary/50 bg-muted/10 ${
                        uploading && 'pointer-events-none opacity-60'
                      }`}
                    >
                      {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className="text-xs font-medium text-foreground">
                        {uploading ? 'Uploading...' : 'Click to add images'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          void handleUpload(e.target.files)
                          e.target.value = ''
                        }}
                      />
                    </label>

                    {adminImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 border border-border rounded-lg p-2 bg-muted/20">
                        {adminImages.map((img) => (
                          <div key={img.publicId} className="group relative aspect-square rounded border border-border overflow-hidden bg-background">
                            <img src={img.url} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              aria-label="Remove image"
                              onClick={() => removeAdminImage(img.publicId)}
                              className="absolute right-0.5 top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Image Handling Strategy (Merge Mode) */}
                  {adminImages.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Image Handling Strategy</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                          <input
                            type="radio"
                            name="imageMergeMode"
                            value="append"
                            checked={imageMergeMode === 'append'}
                            onChange={() => setImageMergeMode('append')}
                            className="h-3.5 w-3.5 border-input accent-primary"
                          />
                          Append to vendor images
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                          <input
                            type="radio"
                            name="imageMergeMode"
                            value="replace"
                            checked={imageMergeMode === 'replace'}
                            onChange={() => setImageMergeMode('replace')}
                            className="h-3.5 w-3.5 border-input accent-primary"
                          />
                          Replace vendor images
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModal(null)}
                      className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reviewMutation.isPending || uploading}
                      className="inline-flex items-center gap-2 rounded-xl bg-success-600 px-4 py-2 text-sm font-medium text-white hover:bg-success-700 transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {reviewMutation.isPending ? 'Approving...' : uploading ? 'Uploading...' : 'Approve'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h2 className="text-lg font-semibold text-foreground">Reject Product</h2>
                  <button onClick={() => setModal(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleReject} className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="text-sm font-medium text-foreground">{modal.product.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Rejection Reason *</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      required
                      minLength={5}
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      placeholder="Explain why this product is being rejected..."
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModal(null)}
                      className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reviewMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-error-600 px-4 py-2 text-sm font-medium text-white hover:bg-error-700 transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      {reviewMutation.isPending ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Queue Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No products pending review. All caught up!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 hidden sm:table-cell">Vendor</th>
                <th className="px-4 py-3 hidden md:table-cell">Vendor Price</th>
                <th className="px-4 py-3 hidden lg:table-cell">Category</th>
                <th className="px-4 py-3 hidden lg:table-cell">Submitted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const vendor = product.vendor as User | undefined
                const category = product.category as any
                return (
                  <tr key={product._id} className="transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm text-foreground">
                      {vendor ? getUserName(vendor) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm font-medium text-foreground">
                      {product.vendorPrice != null ? formatPrice(product.vendorPrice) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                      {category?.name || '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                      {product.submittedAt ? formatDate(product.submittedAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openApproveModal(product)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-success-50 dark:bg-success-950/30 px-3 py-1.5 text-xs font-medium text-success-700 dark:text-success-400 hover:bg-success-100 dark:hover:bg-success-950/50 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(product)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-error-50 dark:bg-error-950/30 px-3 py-1.5 text-xs font-medium text-error-700 dark:text-error-400 hover:bg-error-100 dark:hover:bg-error-950/50 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
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
