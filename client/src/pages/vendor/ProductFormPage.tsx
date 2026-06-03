import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Send, AlertTriangle, ArrowLeft, XCircle } from 'lucide-react'
import { vendorApi } from '@/services/vendorApi'
import { categoryApi, brandApi } from '@/services'
import { AdminPageHeader } from '@/components/admin'
import { ErrorFallback } from '@/components/ui/error'
import { Loader, Skeleton } from '@/components/ui/loader'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { VendorProductFormData, Category, Brand } from '@/types'

// ─── Vendor Product Form ────────────────────────────────────────────────────────

const initialFormState: VendorProductFormData = {
  name: '',
  description: '',
  shortDescription: '',
  sku: '',
  vendorPrice: 0,
  category: '',
  brand: '',
  tags: [],
  images: [],
  stock: 0,
  lowStockThreshold: 5,
  specifications: [],
  manufacturer: '',
  warranty: '',
  voltageRating: '',
  currentRating: '',
  vendorNote: '',
}

export default function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<VendorProductFormData>(initialFormState)
  const [tagInput, setTagInput] = useState('')

  // Fetch existing product for edit
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['vendor', 'product', id],
    queryFn: () => vendorApi.getProduct(id!).then((res) => res.data.data),
    enabled: isEdit,
  })

  // Fetch categories and brands for select dropdowns
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then((res) => res.data.data),
  })

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandApi.getAll().then((res) => res.data.data),
  })

  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : []
  const brands: Brand[] = Array.isArray(brandsData) ? brandsData : []

  // Populate form on edit
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        sku: product.sku || '',
        vendorPrice: product.vendorPrice || 0,
        category: typeof product.category === 'string' ? product.category : product.category?._id || '',
        brand: typeof product.brand === 'string' ? product.brand : product.brand?._id || '',
        tags: product.tags || [],
        images: product.images || [],
        stock: product.stock || 0,
        lowStockThreshold: product.lowStockThreshold || 5,
        specifications: product.specifications || [],
        manufacturer: product.manufacturer || '',
        warranty: product.warranty || '',
        voltageRating: product.voltageRating || '',
        currentRating: product.currentRating || '',
        vendorNote: product.vendorNote || '',
      })
    }
  }, [product])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: VendorProductFormData) => vendorApi.createProduct(data),
    onSuccess: () => {
      toast.success('Product created as draft')
      queryClient.invalidateQueries({ queryKey: ['vendor'] })
      navigate('/vendor/products')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create product')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<VendorProductFormData>) => vendorApi.updateProduct(id!, data),
    onSuccess: () => {
      toast.success('Product updated')
      queryClient.invalidateQueries({ queryKey: ['vendor'] })
      navigate('/vendor/products')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update product')
    },
  })

  // Submit for review mutation
  const submitMutation = useMutation({
    mutationFn: () => vendorApi.submitForReview(id!),
    onSuccess: () => {
      toast.success('Product submitted for review')
      queryClient.invalidateQueries({ queryKey: ['vendor'] })
      navigate('/vendor/products')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit product')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      updateMutation.mutate(form)
    } else {
      createMutation.mutate(form)
    }
  }

  const handleChange = (field: keyof VendorProductFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    if (tagInput.trim() && !form.tags?.includes(tagInput.trim().toLowerCase())) {
      setForm((prev) => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim().toLowerCase()] }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: (prev.tags || []).filter((t) => t !== tag) }))
  }

  const addSpec = () => {
    setForm((prev) => ({
      ...prev,
      specifications: [...(prev.specifications || []), { key: '', value: '', group: 'General' }],
    }))
  }

  const updateSpec = (index: number, field: string, value: string) => {
    setForm((prev) => {
      const specs = [...(prev.specifications || [])]
      specs[index] = { ...specs[index], [field]: value }
      return { ...prev, specifications: specs }
    })
  }

  const removeSpec = (index: number) => {
    setForm((prev) => ({
      ...prev,
      specifications: (prev.specifications || []).filter((_, i) => i !== index),
    }))
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const isReadOnly = product?.approvalStatus === 'pending_review'
  const isApproved = product?.approvalStatus === 'approved'

  if (isEdit && productLoading) {
    return <Loader fullScreen text="Loading product..." />
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={isEdit ? 'Edit Product' : 'New Product'}
        description={isEdit ? `Editing "${product?.name}"` : 'Create a new product draft'}
        action={
          <button
            onClick={() => navigate('/vendor/products')}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        }
      />

      {/* Status Alerts */}
      {isReadOnly && (
        <div className="flex items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-950/30 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-warning-500 shrink-0" />
          <p className="text-sm text-warning-700 dark:text-warning-300">
            This product is under review and cannot be edited until the review is complete.
          </p>
        </div>
      )}

      {isApproved && isEdit && (
        <div className="flex items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-950/30 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-warning-500 shrink-0" />
          <p className="text-sm text-warning-700 dark:text-warning-300">
            Saving changes will revert this product to draft status and remove it from the storefront. You will need to re-submit it for review.
          </p>
        </div>
      )}

      {product?.approvalStatus === 'rejected' && product.rejectionReason && (
        <div className="flex items-start gap-3 rounded-xl border border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-950/30 px-4 py-3">
          <XCircle className="h-5 w-5 text-error-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-error-700 dark:text-error-300">Product Rejected</p>
            <p className="text-sm text-error-600 dark:text-error-400 mt-0.5">{product.rejectionReason}</p>
          </div>
        </div>
      )}

      {isEdit && product?.approvalStatus && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge
            variant={
              product.approvalStatus === 'approved' ? 'success' :
              product.approvalStatus === 'rejected' ? 'error' :
              product.approvalStatus === 'pending_review' ? 'warning' : 'secondary'
            }
          >
            {product.approvalStatus === 'pending_review' ? 'Pending Review' :
             product.approvalStatus.charAt(0).toUpperCase() + product.approvalStatus.slice(1)}
          </Badge>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <fieldset disabled={isReadOnly} className="space-y-6 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground">Product Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Arduino Uno R3"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">SKU *</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. ARD-UNO-R3"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Vendor Price (₹) *</label>
              <input
                type="number"
                value={form.vendorPrice || ''}
                onChange={(e) => handleChange('vendorPrice', parseFloat(e.target.value) || 0)}
                required
                min="0"
                step="0.01"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Your supply price"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
              rows={4}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Detailed product description..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Short Description</label>
            <input
              type="text"
              value={form.shortDescription || ''}
              onChange={(e) => handleChange('shortDescription', e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Brief summary for listing cards"
            />
          </div>
        </fieldset>

        {/* Categorization */}
        <fieldset disabled={isReadOnly} className="space-y-6 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Categorization</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Category *</label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Brand *</label>
              <select
                value={form.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-foreground">Tags</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Add tag and press Enter"
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
              >
                Add
              </button>
            </div>
            {form.tags && form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" size="sm" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-foreground">×</button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </fieldset>

        {/* Inventory */}
        <fieldset disabled={isReadOnly} className="space-y-6 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Inventory</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Stock *</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
                required
                min="0"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Low Stock Threshold</label>
              <input
                type="number"
                value={form.lowStockThreshold || ''}
                onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                min="0"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Manufacturer</label>
              <input
                type="text"
                value={form.manufacturer || ''}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Warranty</label>
              <input
                type="text"
                value={form.warranty || ''}
                onChange={(e) => handleChange('warranty', e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. 1 Year"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Voltage Rating</label>
              <input
                type="text"
                value={form.voltageRating || ''}
                onChange={(e) => handleChange('voltageRating', e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. 3.3V - 5V"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Current Rating</label>
              <input
                type="text"
                value={form.currentRating || ''}
                onChange={(e) => handleChange('currentRating', e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. 500mA"
              />
            </div>
          </div>
        </fieldset>

        {/* Specifications */}
        <fieldset disabled={isReadOnly} className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Specifications</h2>
            <button
              type="button"
              onClick={addSpec}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
            >
              + Add Spec
            </button>
          </div>

          {(form.specifications || []).map((spec, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                value={spec.key}
                onChange={(e) => updateSpec(i, 'key', e.target.value)}
                placeholder="Key"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <input
                type="text"
                value={spec.value}
                onChange={(e) => updateSpec(i, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeSpec(i)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-950/50"
              >
                ×
              </button>
            </div>
          ))}
        </fieldset>

        {/* Vendor Note */}
        <fieldset disabled={isReadOnly} className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Note to Admin</h2>
          <textarea
            value={form.vendorNote || ''}
            onChange={(e) => handleChange('vendorNote', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            placeholder="Optional: Any notes for the admin reviewing this product..."
          />
        </fieldset>

        {/* Form Actions */}
        {!isReadOnly && (
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Draft'}
            </button>

            {isEdit && (product?.approvalStatus === 'draft' || product?.approvalStatus === 'rejected') && (
              <button
                type="button"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-primary bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {submitMutation.isPending ? 'Submitting...' : 'Submit for Review'}
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
