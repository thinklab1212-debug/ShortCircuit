import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Package, Plus, Send, Edit2, Trash2 } from 'lucide-react'
import { vendorApi } from '@/services/vendorApi'
import { AdminPageHeader } from '@/components/admin'
import { Badge } from '@/components/ui/badge'
import { ErrorFallback } from '@/components/ui/error'
import { Skeleton } from '@/components/ui/loader'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/utils'
import { toast } from 'sonner'
import type { ApprovalStatus, Product } from '@/types'

// ─── Vendor Products Page ───────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: ApprovalStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  draft: 'secondary',
  pending_review: 'warning',
  approved: 'success',
  rejected: 'destructive',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<ApprovalStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vendor', 'products', activeTab, page],
    queryFn: () =>
      vendorApi
        .getProducts({
          page,
          limit: 20,
          ...(activeTab !== 'all' ? { approvalStatus: activeTab } : {}),
        })
        .then((res) => res.data),
  })

  const submitMutation = useMutation({
    mutationFn: (id: string) => vendorApi.submitForReview(id),
    onSuccess: () => {
      toast.success('Product submitted for review')
      queryClient.invalidateQueries({ queryKey: ['vendor'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit product')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorApi.deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deactivated')
      queryClient.invalidateQueries({ queryKey: ['vendor'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to deactivate product')
    },
  })

  if (isError) {
    return <ErrorFallback error={error as Error} resetErrorBoundary={() => void refetch()} />
  }

  const products: Product[] = data?.data ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="My Products"
        description="Manage your product catalogue"
        action={
          <Link
            to="/vendor/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        }
      />

      {/* Status Filter Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setPage(1) }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {activeTab === 'all' ? 'No products yet. Create your first product!' : `No ${STATUS_LABELS[activeTab]?.toLowerCase()} products.`}
            </p>
            {activeTab === 'all' && (
              <Link
                to="/vendor/products/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Product
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 hidden sm:table-cell">Vendor Price</th>
                <th className="px-4 py-3 hidden md:table-cell">Selling Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product._id} className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm font-medium text-foreground">
                    {product.vendorPrice != null ? formatPrice(product.vendorPrice) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">
                    {product.price && product.price > 0
                      ? formatPrice(product.salePrice || product.price)
                      : <span className="text-xs italic">Pending</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE_VARIANT[product.approvalStatus || 'draft']} size="sm">
                      {STATUS_LABELS[product.approvalStatus || 'draft']}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {(product.approvalStatus === 'draft' || product.approvalStatus === 'rejected') && (
                        <button
                          onClick={() => submitMutation.mutate(product._id)}
                          disabled={submitMutation.isPending}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Submit for Review"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {product.approvalStatus !== 'pending_review' && (
                        <Link
                          to={`/vendor/products/${product._id}/edit`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to deactivate this product?')) {
                            deleteMutation.mutate(product._id)
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-950/50 transition-colors"
                        title="Deactivate"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
