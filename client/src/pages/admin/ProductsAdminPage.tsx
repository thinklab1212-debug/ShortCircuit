import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, Layers, RefreshCw, Upload } from 'lucide-react'
import { productApi } from '@/services'
import {
  AdminPageHeader,
  TablePagination,
  BulkImportModal,
} from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ErrorFallback } from '@/components/ui/error'
import { formatPrice, primaryImage } from '@/utils'
import type { Category, Product } from '@/types'

// ─── Products Admin List ────────────────────────────────────────────────────────

const LIMIT = 10

function categoryName(category: Product['category']): string {
  if (!category) return '—'
  if (typeof category === 'string') return category
  return (category as Category).name
}

export default function ProductsAdminPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = parseInt(searchParams.get('page') || '1', 10)
  const search = searchParams.get('search') || ''

  const [searchInput, setSearchInput] = useState(search)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)

  // Keep searchInput in sync when URL search parameter changes
  useEffect(() => {
    setSearchInput(search)
  }, [search])

  const setPage = (newPage: number) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set('page', newPage.toString())
      if (search) p.set('search', search)
      return p
    })
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'products', { page, search }],
    queryFn: () =>
      productApi
        .getAdminAll({ page, limit: LIMIT, search: search || undefined })
        .then((res) => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => {
      toast.success('Product deleted')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
    onError: () => toast.error('Failed to delete product'),
  })

  const syncSheetsMutation = useMutation({
    mutationFn: () => productApi.syncGoogleSheets(),
    onSuccess: (res) => {
      const { totalSynced } = res.data.data
      toast.success(`Successfully exported ${totalSynced} items to Google Sheets!`)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to sync to Google Sheets. Verify credentials in .env.')
    },
  })

  const products = data?.data ?? []
  const pagination = data?.pagination

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set('page', '1')
      if (searchInput.trim()) {
        p.set('search', searchInput.trim())
      } else {
        p.delete('search')
      }
      return p
    })
  }

  if (isError) {
    return (
      <ErrorFallback error={error as Error} resetErrorBoundary={() => void refetch()} />
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        description="Manage your product catalog"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkImportOpen(true)}
              leftIcon={<Upload className="h-4 w-4 text-primary-400" />}
            >
              Bulk Import
            </Button>
            <Button
              variant="outline"
              loading={syncSheetsMutation.isPending}
              onClick={() => syncSheetsMutation.mutate()}
              leftIcon={<RefreshCw className="h-4 w-4 text-success-500" />}
            >
              Sync to Google Sheets
            </Button>
            <Button asChild leftIcon={<Plus />}>
              <Link to="/admin/products/new">Add Product</Link>
            </Button>
          </div>
        }
      />


      <form onSubmit={submitSearch} className="flex gap-2">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products by name or SKU..."
          leftIcon={<Search className="h-4 w-4" />}
          className="max-w-md"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: LIMIT }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const low =
                    product.stock > 0 &&
                    product.stock <= (product.lowStockThreshold ?? 5)
                  return (
                    <tr key={product._id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={primaryImage(product)}
                            alt={product.name}
                            className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
                          />
                          <span className="line-clamp-2 max-w-[220px] text-sm font-medium text-foreground">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{product.sku}</td>
                      <td className="px-4 py-3 text-sm">
                        {product.productType === 'family' ? (
                          <Badge variant="outline" className="border-accent-500/50 bg-accent-500/10 text-accent-400 font-normal">
                            Family ({product.variantCount ?? 0})
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Standalone</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {categoryName(product.category)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {product.salePrice && product.salePrice < product.price ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {formatPrice(product.salePrice)}
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium text-foreground">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {product.stock <= 0 ? (
                          <Badge variant="destructive" size="sm">
                            Out of stock
                          </Badge>
                        ) : low ? (
                          <Badge variant="warning" size="sm">
                            {product.stock} low
                          </Badge>
                        ) : (
                          <span className="text-foreground">{product.stock}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={product.isActive ? 'success' : 'secondary'} size="sm" dot>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {product.productType === 'family' && (
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Layers className="h-3.5 w-3.5" />}
                              onClick={() => navigate(`/admin/products/${product._id}/variants`)}
                            >
                              Variants
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit"
                            onClick={() => navigate(`/admin/products/${product._id}/edit`)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete"
                            className="text-error-500 hover:text-error-600"
                            onClick={() => setDeleteTarget(product)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <TablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.totalResults}
            limit={pagination.limit}
            onPageChange={setPage}
            className="border-t border-border"
          />
        )}
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Delete product?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">{deleteTarget.name}</span>? This action
              cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  )
}

