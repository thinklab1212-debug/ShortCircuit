import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  FileCode,
} from 'lucide-react'
import { productApi, categoryApi, variantApi } from '@/services'
import type { BatchImportResult } from '@/services/variantApi'
import { AdminPageHeader, DataTable, StatusIndicator } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Badge } from '@/components/ui/badge'
import { ErrorFallback } from '@/components/ui/error'
import { formatPrice } from '@/utils'
import type { LinkedProductVariant } from '@/types'

export default function ProductVariantsAdminPage() {
  const { productId } = useParams<{ productId: string }>()
  const queryClient = useQueryClient()

  // State
  const [page] = useState(1)
  const [singleModalOpen, setSingleModalOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<LinkedProductVariant | null>(null)
  
  // Single Variant Form State
  const [sku, setSku] = useState('')
  const [mpn, setMpn] = useState('')
  const [price, setPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [stock, setStock] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [attributes, setAttributes] = useState<Record<string, string>>({})
  const [numAttributes, setNumAttributes] = useState<Record<string, string>>({})

  // Batch Modal State
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchJsonText, setBatchJsonText] = useState('')
  const [dryRunReport, setDryRunReport] = useState<BatchImportResult | null>(null)

  // 1. Fetch Parent Master Product
  const { data: productList } = useQuery({
    queryKey: ['admin', 'products', 'for-variants-page'],
    queryFn: () => productApi.getAdminAll({ limit: 100 }).then((res) => res.data.data),
    enabled: Boolean(productId),
  })

  const parentProduct = productList?.find((p) => p._id === productId)

  // 2. Fetch Category for Attribute Definitions
  const categoryId = typeof parentProduct?.category === 'string' ? parentProduct.category : parentProduct?.category?._id
  const { data: categoryData } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => categoryApi.getAll().then((res) => res.data.data.find((c) => c._id === categoryId)),
    enabled: Boolean(categoryId),
  })

  // 3. Fetch Linked Product Variants
  const { data: variantData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'variants', productId, { page }],
    queryFn: () => variantApi.getByProduct(productId!, { page, limit: 50 }).then((res) => res.data),
    enabled: Boolean(productId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'variants', productId] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: Partial<LinkedProductVariant>) => variantApi.create(productId!, payload),
    onSuccess: () => {
      toast.success('Variant created')
      invalidate()
      closeSingleModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create variant'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LinkedProductVariant> }) =>
      variantApi.update(id, payload),
    onSuccess: () => {
      toast.success('Variant updated')
      invalidate()
      closeSingleModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update variant'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => variantApi.remove(id),
    onSuccess: () => {
      toast.success('Variant deactivated')
      invalidate()
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to deactivate variant'),
  })

  const batchMutation = useMutation({
    mutationFn: (payload: { variants: Partial<LinkedProductVariant>[]; dryRun?: boolean }) =>
      variantApi.batchCreate(productId!, payload),
    onSuccess: (res, variables) => {
      const result = res.data.data
      setDryRunReport(result)
      if (variables.dryRun) {
        toast.success(result.isValid ? 'Dry-run passed cleanly!' : 'Dry-run validation reported errors.')
      } else if (result.isValid) {
        toast.success(`Successfully imported ${result.validCount} variants!`)
        invalidate()
        closeBatchModal()
      } else {
        toast.error('Batch import failed validation.')
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Batch operation failed'),
  })

  // Modal Controllers
  const openCreateSingle = () => {
    setEditingVariant(null)
    setSku('')
    setMpn('')
    setPrice(String(parentProduct?.price ?? ''))
    setSalePrice('')
    setStock('100')
    setIsActive(true)
    setAttributes({})
    setNumAttributes({})
    setSingleModalOpen(true)
  }

  const openEditSingle = (v: LinkedProductVariant) => {
    setEditingVariant(v)
    setSku(v.sku)
    setMpn(v.mpn || '')
    setPrice(String(v.price))
    setSalePrice(v.salePrice ? String(v.salePrice) : '')
    setStock(String(v.stock))
    setIsActive(v.isActive)
    setAttributes(v.attributes || {})
    setNumAttributes(
      Object.fromEntries(Object.entries(v.numericalAttributes || {}).map(([k, val]) => [k, String(val)]))
    )
    setSingleModalOpen(true)
  }

  const closeSingleModal = () => {
    setSingleModalOpen(false)
    setEditingVariant(null)
  }

  const closeBatchModal = () => {
    setBatchModalOpen(false)
    setBatchJsonText('')
    setDryRunReport(null)
  }

  // Handle Form Submit
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sku.trim()) {
      toast.error('SKU is required')
      return
    }
    if (!price || isNaN(Number(price))) {
      toast.error('Valid price is required')
      return
    }

    const parsedNumAttrs: Record<string, number> = {}
    Object.entries(numAttributes).forEach(([k, v]) => {
      if (v.trim() !== '' && !isNaN(Number(v))) {
        parsedNumAttrs[k] = Number(v)
      }
    })

    const payload: Partial<LinkedProductVariant> = {
      sku: sku.trim().toUpperCase(),
      mpn: mpn.trim() || undefined,
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : undefined,
      stock: Number(stock) || 0,
      isActive,
      attributes,
      numericalAttributes: parsedNumAttrs,
    }

    if (editingVariant) {
      updateMutation.mutate({ id: editingVariant._id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  // Batch Execution Handlers
  const handleRunBatch = (dryRun: boolean) => {
    try {
      const parsed = JSON.parse(batchJsonText)
      if (!Array.isArray(parsed)) {
        toast.error('Batch JSON must be an array of objects')
        return
      }
      batchMutation.mutate({ variants: parsed, dryRun })
    } catch {
      toast.error('Invalid JSON payload. Please verify JSON format.')
    }
  }

  const variants = variantData?.data ?? []
  const attributeDefs = categoryData?.attributeDefinitions ?? []

  const columns = [
    {
      key: 'sku',
      header: 'SKU / MPN',
      render: (v: LinkedProductVariant) => (
        <div>
          <div className="font-semibold text-foreground">{v.sku}</div>
          {v.mpn && <div className="text-xs text-muted-foreground">MPN: {v.mpn}</div>}
        </div>
      ),
    },
    {
      key: 'attributes',
      header: 'Specifications',
      render: (v: LinkedProductVariant) => (
        <div className="flex flex-wrap gap-1">
          {Object.entries(v.attributes || {}).map(([k, val]) => (
            <Badge key={k} variant="secondary" className="text-xs">
              <span className="capitalize font-normal text-muted-foreground mr-1">{k}:</span>
              {val}
            </Badge>
          ))}
          {Object.keys(v.attributes || {}).length === 0 && <span className="text-muted-foreground text-xs">—</span>}
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (v: LinkedProductVariant) => (
        <div>
          <span className="font-medium text-foreground">{formatPrice(v.salePrice ?? v.price)}</span>
          {v.salePrice && <span className="ml-1 text-xs line-through text-muted-foreground">{formatPrice(v.price)}</span>}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (v: LinkedProductVariant) => (
        <span className={v.stock > 0 ? 'text-foreground' : 'text-error-500 font-semibold'}>{v.stock}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (v: LinkedProductVariant) => <StatusIndicator status={v.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (v: LinkedProductVariant) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => openEditSingle(v)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              if (window.confirm(`Deactivate variant SKU "${v.sku}"?`)) {
                deleteMutation.mutate(v._id)
              }
            }}
            className="text-error-500 hover:text-error-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (isError) return <ErrorFallback error={error as Error} resetErrorBoundary={refetch} />

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Page Header */}
      <div>
        <Link to="/admin/products" className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Products
        </Link>
        <AdminPageHeader
          title={`Variants: ${parentProduct?.name || 'Product Family'}`}
          description={`Base SKU: ${parentProduct?.sku || '—'} | Type: Product Family`}
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" leftIcon={<FileCode className="h-4 w-4" />} onClick={() => setBatchModalOpen(true)}>
                Batch Import
              </Button>
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateSingle}>
                Add Variant
              </Button>
            </div>
          }
        />
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <span className="text-xs text-muted-foreground uppercase font-semibold">Active Variant Count</span>
          <div className="text-2xl font-bold text-foreground mt-1">{parentProduct?.variantCount ?? 0} variants</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground uppercase font-semibold">Price Range</span>
          <div className="text-2xl font-bold text-foreground mt-1">
            {formatPrice(parentProduct?.priceRange?.min ?? 0)} – {formatPrice(parentProduct?.priceRange?.max ?? 0)}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground uppercase font-semibold">Category Attribute Definitions</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {attributeDefs.map((def) => (
              <Badge key={def.key} variant="outline" className="text-xs">
                {def.label} ({def.type})
              </Badge>
            ))}
            {attributeDefs.length === 0 && <span className="text-xs text-muted-foreground">No spec templates defined</span>}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns as never}
        data={(variants ?? []) as never}
        isLoading={isLoading}
        emptyMessage="No variants created yet for this Product Family."
      />

      {/* ─── Modal 1: Single Variant Creator / Editor ─── */}
      {singleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeSingleModal} />
          <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              {editingVariant ? `Edit Variant SKU: ${editingVariant.sku}` : 'Add New Variant'}
            </h2>
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="SKU *" required>
                  <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. RES-0805-10K" />
                </FormField>
                <FormField label="MPN (Manufacturer Part Number)">
                  <Input value={mpn} onChange={(e) => setMpn(e.target.value)} placeholder="e.g. RC0805JR-0710KL" />
                </FormField>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField label="Price (₹) *" required>
                  <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2.50" />
                </FormField>
                <FormField label="Sale Price (₹)">
                  <Input type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="2.00" />
                </FormField>
                <FormField label="Stock Qty *" required>
                  <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="100" />
                </FormField>
              </div>

              {/* Dynamic Attribute Inputs from Category Attribute Definitions */}
              {attributeDefs.length > 0 && (
                <div className="border-t border-border pt-3 space-y-3">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Category Specifications</span>
                  <div className="grid grid-cols-2 gap-3">
                    {attributeDefs.map((def) => (
                      <FormField key={def.key} label={`${def.label} ${def.unit ? `(${def.unit})` : ''} ${def.isRequired ? '*' : ''}`}>
                        <Input
                          value={attributes[def.key] || ''}
                          onChange={(e) => setAttributes({ ...attributes, [def.key]: e.target.value })}
                          placeholder={def.options?.length ? `e.g. ${def.options[0]}` : `Enter ${def.label.toLowerCase()}`}
                        />
                      </FormField>
                    ))}
                  </div>
                </div>
              )}

              {/* Numerical Attributes for Parametric Search */}
              <div className="border-t border-border pt-3 space-y-3">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Indexed Numerical Range Search Values</span>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="resistance_ohms (numeric)">
                    <Input
                      type="number"
                      value={numAttributes['resistance_ohms'] || ''}
                      onChange={(e) => setNumAttributes({ ...numAttributes, resistance_ohms: e.target.value })}
                      placeholder="e.g. 10000"
                    />
                  </FormField>
                  <FormField label="capacitance_farads (numeric)">
                    <Input
                      type="number"
                      value={numAttributes['capacitance_farads'] || ''}
                      onChange={(e) => setNumAttributes({ ...numAttributes, capacitance_farads: e.target.value })}
                      placeholder="e.g. 0.0000001"
                    />
                  </FormField>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="ghost" onClick={closeSingleModal}>
                  Cancel
                </Button>
                <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                  {editingVariant ? 'Update Variant' : 'Create Variant'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Batch Pre-Validation & Importer ─── */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeBatchModal} />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileCode className="h-5 w-5 text-accent-500" /> Batch Variant Import & Pre-Validation
              </h2>
              <Button variant="ghost" size="icon-sm" onClick={closeBatchModal}>
                ✕
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Paste a JSON array of variants to run 7-step pre-validation. Test with dry-run before writing to DB.
            </p>

            <textarea
              className="w-full h-48 rounded-xl border border-border bg-background p-3 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder={`[\n  {\n    "sku": "RES-0805-10K",\n    "mpn": "RC0805JR-0710KL",\n    "price": 2.50,\n    "stock": 1000,\n    "attributes": { "resistance": "10 kΩ", "tolerance": "1%", "package": "0805" },\n    "numericalAttributes": { "resistance_ohms": 10000 }\n  }\n]`}
              value={batchJsonText}
              onChange={(e) => setBatchJsonText(e.target.value)}
            />

            {/* Dry Run Report Box */}
            {dryRunReport && (
              <div className={`p-4 rounded-xl border ${dryRunReport.isValid ? 'border-success-500/30 bg-success-500/10' : 'border-error-500/30 bg-error-500/10'}`}>
                <div className="flex items-center gap-2 font-semibold text-sm">
                  {dryRunReport.isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-success-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-error-500" />
                  )}
                  {dryRunReport.isValid ? 'Pre-Validation Passed Cleanly!' : 'Pre-Validation Reported Errors'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total Rows: {dryRunReport.totalRows} | Valid: {dryRunReport.validCount} | Errors: {dryRunReport.errors.length}
                </div>

                {dryRunReport.errors.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {dryRunReport.errors.map((err, idx) => (
                      <div key={idx} className="text-xs text-error-400 font-mono">
                        Row {err.index + 1} {err.sku ? `(SKU: ${err.sku})` : ''}: {err.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button variant="ghost" onClick={closeBatchModal}>
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" loading={batchMutation.isPending} onClick={() => handleRunBatch(true)}>
                  Test Run (Dry-Run)
                </Button>
                <Button loading={batchMutation.isPending} onClick={() => handleRunBatch(false)}>
                  Commit Batch Import
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
