import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, Link } from 'react-router'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Star,
  Loader2,
  X,
} from 'lucide-react'
import { productApi, categoryApi, brandApi, uploadApi } from '@/services'
import { AdminPageHeader, AdminSection } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { Loader } from '@/components/ui/loader'
import { cn } from '@/lib/utils'
import type { Category, ProductImage, ProductSpecification } from '@/types'

// ─── Product Create / Edit ──────────────────────────────────────────────────────

interface SpecRow extends ProductSpecification {}

interface FormState {
  name: string
  sku: string
  shortDescription: string
  description: string
  price: string
  salePrice: string
  stock: string
  lowStockThreshold: string
  category: string
  brand: string
  tags: string
  isFeatured: boolean
  isActive: boolean
}

const EMPTY: FormState = {
  name: '',
  sku: '',
  shortDescription: '',
  description: '',
  price: '',
  salePrice: '',
  stock: '0',
  lowStockThreshold: '5',
  category: '',
  brand: '',
  tags: '',
  isFeatured: false,
  isActive: true,
}

const SKU_RE = /^[A-Z0-9-]+$/

function idOf(ref: Category | string | undefined): string {
  if (!ref) return ''
  return typeof ref === 'string' ? ref : ref._id
}

export default function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormState>(EMPTY)
  const [images, setImages] = useState<ProductImage[]>([])
  const [specs, setSpecs] = useState<SpecRow[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)

  // Reference data
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then((res) => res.data.data),
  })
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandApi.getAll().then((res) => res.data.data),
  })

  // Existing product (edit): no get-by-id, so fetch a page and find it
  const { data: productList, isLoading: loadingProduct } = useQuery({
    queryKey: ['admin', 'products', 'all-for-edit'],
    queryFn: () => productApi.getAdminAll({ limit: 100 }).then((res) => res.data.data),
    enabled: isEdit,
  })

  const existing = useMemo(
    () => productList?.find((p) => p._id === id),
    [productList, id]
  )

  useEffect(() => {
    if (!existing) return
    setForm({
      name: existing.name ?? '',
      sku: existing.sku ?? '',
      shortDescription: existing.shortDescription ?? '',
      description: existing.description ?? '',
      price: String(existing.price ?? ''),
      salePrice: existing.salePrice != null ? String(existing.salePrice) : '',
      stock: String(existing.stock ?? 0),
      lowStockThreshold:
        existing.lowStockThreshold != null ? String(existing.lowStockThreshold) : '5',
      category: idOf(existing.category),
      brand: idOf(existing.brand),
      tags: (existing.tags ?? []).join(', '),
      isFeatured: existing.isFeatured ?? false,
      isActive: existing.isActive ?? true,
    })
    setImages(existing.images ?? [])
    setSpecs(existing.specifications ?? [])
  }, [existing])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // Images
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const res = await uploadApi.image(file)
        const { url, publicId } = res.data.data
        setImages((prev) => [
          ...prev,
          { url, publicId, isPrimary: prev.length === 0 },
        ])
      }
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (publicId: string) =>
    setImages((prev) => {
      const next = prev.filter((img) => img.publicId !== publicId)
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true }
      }
      return next
    })

  const setPrimary = (publicId: string) =>
    setImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.publicId === publicId }))
    )

  // Specs
  const addSpec = () => setSpecs((prev) => [...prev, { key: '', value: '' }])
  const updateSpec = (i: number, field: 'key' | 'value', value: string) =>
    setSpecs((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  const removeSpec = (i: number) =>
    setSpecs((prev) => prev.filter((_, idx) => idx !== i))

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    else if (!SKU_RE.test(form.sku.trim()))
      e.sku = 'SKU must be uppercase letters, numbers and hyphens'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.category) e.category = 'Category is required'
    if (!form.brand) e.brand = 'Brand is required'
    const price = Number(form.price)
    if (!form.price || Number.isNaN(price) || price <= 0) e.price = 'Enter a valid price'
    if (form.salePrice) {
      const sale = Number(form.salePrice)
      if (Number.isNaN(sale) || sale <= 0) e.salePrice = 'Enter a valid sale price'
      else if (sale >= price) e.salePrice = 'Sale price must be less than price'
    }
    const stock = Number(form.stock)
    if (Number.isNaN(stock) || stock < 0) e.stock = 'Enter a valid stock'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        shortDescription: form.shortDescription.trim() || undefined,
        sku: form.sku.trim().toUpperCase(),
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : undefined,
        category: form.category,
        brand: form.brand,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        images,
        stock: Number(form.stock),
        lowStockThreshold: form.lowStockThreshold
          ? Number(form.lowStockThreshold)
          : undefined,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        specifications: specs.filter((s) => s.key.trim() && s.value.trim()),
      }
      return isEdit && id
        ? productApi.update(id, payload)
        : productApi.create(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated' : 'Product created')
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      navigate('/admin/products')
    },
    onError: () => toast.error('Failed to save product'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the errors in the form')
      return
    }
    mutation.mutate()
  }

  if (isEdit && loadingProduct) {
    return <Loader fullScreen text="Loading product..." />
  }

  if (isEdit && !loadingProduct && !existing) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Product not found" />
        <Button asChild variant="outline" leftIcon={<ArrowLeft />}>
          <Link to="/admin/products">Back to products</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <AdminPageHeader
        title={isEdit ? 'Edit Product' : 'New Product'}
        description={isEdit ? 'Update product details' : 'Add a new product to your catalog'}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline" leftIcon={<ArrowLeft />}>
              <Link to="/admin/products">Cancel</Link>
            </Button>
            <Button type="submit" loading={mutation.isPending} loadingText="Saving...">
              {isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Basic info */}
          <AdminSection title="Basic Information">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <FormField label="Name" htmlFor="name" required error={errors.name}>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  error={!!errors.name}
                  placeholder="Product name"
                />
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="SKU"
                  htmlFor="sku"
                  required
                  error={errors.sku}
                  hint="Uppercase letters, numbers, hyphens"
                >
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => set('sku', e.target.value.toUpperCase())}
                    error={!!errors.sku}
                    placeholder="ABC-123"
                  />
                </FormField>
                <FormField label="Tags" htmlFor="tags" hint="Comma-separated">
                  <Input
                    id="tags"
                    value={form.tags}
                    onChange={(e) => set('tags', e.target.value)}
                    placeholder="wireless, gaming"
                  />
                </FormField>
              </div>

              <FormField label="Short Description" htmlFor="shortDescription">
                <Input
                  id="shortDescription"
                  value={form.shortDescription}
                  onChange={(e) => set('shortDescription', e.target.value)}
                  placeholder="A brief one-liner"
                />
              </FormField>

              <FormField
                label="Description"
                htmlFor="description"
                required
                error={errors.description}
              >
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  error={!!errors.description}
                  rows={5}
                  placeholder="Detailed product description"
                />
              </FormField>
            </div>
          </AdminSection>

          {/* Pricing & stock */}
          <AdminSection title="Pricing & Inventory">
            <div className="rounded-2xl border border-border bg-card p-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Price (₹)" htmlFor="price" required error={errors.price}>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  error={!!errors.price}
                />
              </FormField>
              <FormField label="Sale Price (₹)" htmlFor="salePrice" error={errors.salePrice}>
                <Input
                  id="salePrice"
                  type="number"
                  min="0"
                  value={form.salePrice}
                  onChange={(e) => set('salePrice', e.target.value)}
                  error={!!errors.salePrice}
                />
              </FormField>
              <FormField label="Stock" htmlFor="stock" required error={errors.stock}>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => set('stock', e.target.value)}
                  error={!!errors.stock}
                />
              </FormField>
              <FormField label="Low Stock Threshold" htmlFor="lowStockThreshold">
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) => set('lowStockThreshold', e.target.value)}
                />
              </FormField>
            </div>
          </AdminSection>

          {/* Specifications */}
          <AdminSection title="Specifications">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
              {specs.length === 0 && (
                <p className="text-sm text-muted-foreground">No specifications added.</p>
              )}
              {specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={spec.key}
                    onChange={(e) => updateSpec(i, 'key', e.target.value)}
                    placeholder="Key (e.g. Weight)"
                  />
                  <Input
                    value={spec.value}
                    onChange={(e) => updateSpec(i, 'value', e.target.value)}
                    placeholder="Value (e.g. 250g)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove spec"
                    className="shrink-0 text-error-500"
                    onClick={() => removeSpec(i)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" leftIcon={<Plus />} onClick={addSpec}>
                Add Specification
              </Button>
            </div>
          </AdminSection>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AdminSection title="Organization">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <FormField label="Category" htmlFor="category" required error={errors.category}>
                <Select
                  id="category"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  error={!!errors.category}
                >
                  <option value="">Select category</option>
                  {(categories ?? []).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Brand" htmlFor="brand" required error={errors.brand}>
                <Select
                  id="brand"
                  value={form.brand}
                  onChange={(e) => set('brand', e.target.value)}
                  error={!!errors.brand}
                >
                  <option value="">Select brand</option>
                  {(brands ?? []).map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <label className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={form.isFeatured}
                  onChange={(e) => set('isFeatured', e.target.checked)}
                />
                Featured product
              </label>
              <label className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={form.isActive}
                  onChange={(e) => set('isActive', e.target.checked)}
                />
                Active (visible in store)
              </label>
            </div>
          </AdminSection>

          <AdminSection title="Images">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <label
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50',
                  uploading && 'pointer-events-none opacity-60'
                )}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {uploading ? 'Uploading...' : 'Click to upload images'}
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

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img) => (
                    <div
                      key={img.publicId}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                    >
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() => removeImage(img.publicId)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Set as primary"
                        onClick={() => setPrimary(img.publicId)}
                        className={cn(
                          'absolute bottom-1 left-1 flex h-6 w-6 items-center justify-center rounded-full transition-colors',
                          img.isPrimary
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-black/60 text-white opacity-0 group-hover:opacity-100'
                        )}
                      >
                        <Star className={cn('h-3.5 w-3.5', img.isPrimary && 'fill-current')} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AdminSection>
        </div>
      </div>
    </form>
  )
}
