import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  X,
  Plus,
  Edit3,
  Loader2,
  Database,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { productApi } from '@/services'
import type { BulkImportPreviewResult, BulkPreviewItem } from '@/types'

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'all' | 'create' | 'update' | 'error'

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewResult, setPreviewResult] = useState<BulkImportPreviewResult | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('all')

  // Preview Mutation
  const previewMutation = useMutation({
    mutationFn: ({ source, file }: { source: 'file' | 'google_sheets'; file?: File }) =>
      productApi.previewBulkImport(source, file).then((res) => res.data.data),
    onSuccess: (data) => {
      setPreviewResult(data)
      toast.success(`Preview generated: ${data.validCount} valid items, ${data.errorCount} errors`)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to generate import preview.')
    },
  })

  // Execute Mutation (with batch chunking to prevent 413 payload limit errors)
  const executeMutation = useMutation({
    mutationFn: async (validItems: BulkPreviewItem[]) => {
      const BATCH_SIZE = 50
      let createdCount = 0
      let updatedCount = 0
      let totalExecuted = 0

      for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
        const chunk = validItems.slice(i, i + BATCH_SIZE)
        const res = await productApi.executeBulkImport(chunk)
        const data = res.data.data
        createdCount += data.createdCount
        updatedCount += data.updatedCount
        totalExecuted += data.totalExecuted
      }

      return { createdCount, updatedCount, totalExecuted }
    },
    onSuccess: (data) => {
      toast.success(
        `Bulk Import Successful! Created ${data.createdCount} products, updated ${data.updatedCount} products.`
      )
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      handleClose()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to execute bulk import.')
    },
  })

  if (!isOpen) return null

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewResult(null)
    setActiveTab('all')
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      previewMutation.mutate({ source: 'file', file })
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      previewMutation.mutate({ source: 'file', file })
    }
  }

  const validItemsToImport = previewResult?.items.filter((i) => i.action !== 'error') || []

  const filteredItems = previewResult?.items.filter((item) => {
    if (activeTab === 'create') return item.action === 'create'
    if (activeTab === 'update') return item.action === 'update'
    if (activeTab === 'error') return item.action === 'error'
    return true
  }) || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Bulk Product Import & Sync</h2>
              <p className="text-xs text-muted-foreground">
                Upload Excel/CSV spreadsheets or pull directly from Google Sheets
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {!previewResult ? (
            /* Step 1: Select Import Source */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Drag and Drop File Upload */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center transition-colors hover:border-primary-500/50 hover:bg-muted/40"
                >
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    disabled={previewMutation.isPending}
                  />
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
                    <Upload className="h-7 w-7" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Upload Spreadsheet File</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Drag and drop your <span className="font-medium text-foreground">.xlsx</span>,{' '}
                    <span className="font-medium text-foreground">.xls</span>, or{' '}
                    <span className="font-medium text-foreground">.csv</span> file here
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    loading={previewMutation.isPending && selectedFile !== null}
                  >
                    Browse Files
                  </Button>
                </div>

                {/* Google Sheets Sync Pull */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/20 p-8 text-center hover:bg-muted/40 transition-colors">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-500/10 text-success-500">
                    <FileSpreadsheet className="h-7 w-7" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Pull from Google Sheets</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Fetch live product data directly from your configured shared Google Sheet
                  </p>
                  <Button
                    variant="success"
                    size="sm"
                    className="mt-4"
                    loading={previewMutation.isPending && selectedFile === null}
                    onClick={() => previewMutation.mutate({ source: 'google_sheets' })}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Fetch Google Sheet Data
                  </Button>
                </div>
              </div>

              {previewMutation.isPending && (
                <div className="flex items-center justify-center gap-3 rounded-xl border border-primary-500/20 bg-primary-500/10 p-4 text-primary-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">Parsing data & performing dry-run validation...</span>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Dry-Run Preview Summary & Tabbed View */
            <div className="space-y-6">
              {/* Stat Summary Header */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground font-medium">Total Rows</p>
                  <p className="text-xl font-bold text-foreground">{previewResult.totalRows}</p>
                </div>
                <div className="rounded-xl border border-success-500/30 bg-success-500/10 p-3">
                  <p className="text-xs text-success-400 font-medium">Valid Items</p>
                  <p className="text-xl font-bold text-success-400">{previewResult.validCount}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <p className="text-xs text-emerald-400 font-medium">New Products</p>
                  <p className="text-xl font-bold text-emerald-400">{previewResult.newProductsCount}</p>
                </div>
                <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
                  <p className="text-xs text-sky-400 font-medium">Updates</p>
                  <p className="text-xl font-bold text-sky-400">{previewResult.updatedProductsCount}</p>
                </div>
                <div className="rounded-xl border border-error-500/30 bg-error-500/10 p-3">
                  <p className="text-xs text-error-400 font-medium">Validation Errors</p>
                  <p className="text-xl font-bold text-error-400">{previewResult.errorCount}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant={activeTab === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('all')}
                  >
                    All ({previewResult.totalRows})
                  </Button>
                  <Button
                    variant={activeTab === 'create' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('create')}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-400" />
                    New ({previewResult.newProductsCount})
                  </Button>
                  <Button
                    variant={activeTab === 'update' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('update')}
                    className="gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-sky-400" />
                    Updates ({previewResult.updatedProductsCount})
                  </Button>
                  <Button
                    variant={activeTab === 'error' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('error')}
                    className="gap-1.5"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-error-400" />
                    Errors ({previewResult.errorCount})
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewResult(null)}
                  leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                >
                  Change File / Re-fetch
                </Button>
              </div>

              {/* Preview Table */}
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-md uppercase tracking-wider text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-3 py-2.5">Row</th>
                        <th className="px-3 py-2.5">Action</th>
                        <th className="px-3 py-2.5">SKU</th>
                        <th className="px-3 py-2.5">Product Name</th>
                        <th className="px-3 py-2.5">Category</th>
                        <th className="px-3 py-2.5">Brand</th>
                        <th className="px-3 py-2.5">Price</th>
                        <th className="px-3 py-2.5">Stock</th>
                        <th className="px-3 py-2.5">Details / Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-muted-foreground">
                            No items match the selected tab filter.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item) => (
                          <tr
                            key={`${item.rowNumber}-${item.sku}`}
                            className={
                              item.action === 'error'
                                ? 'bg-error-500/5 hover:bg-error-500/10'
                                : 'hover:bg-muted/30'
                            }
                          >
                            <td className="px-3 py-2.5 font-mono text-muted-foreground">#{item.rowNumber}</td>
                            <td className="px-3 py-2.5">
                              {item.action === 'create' && (
                                <Badge variant="success" size="sm">
                                  + Create
                                </Badge>
                              )}
                              {item.action === 'update' && (
                                <Badge variant="secondary" size="sm">
                                  ⚡ Update
                                </Badge>
                              )}
                              {item.action === 'error' && (
                                <Badge variant="destructive" size="sm">
                                  ❌ Error
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-2.5 font-mono font-medium text-foreground">{item.sku}</td>
                            <td className="px-3 py-2.5 font-medium text-foreground max-w-[180px] truncate">
                              {item.name}
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground">{item.categoryName || '—'}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">{item.brandName || '—'}</td>
                            <td className="px-3 py-2.5 font-medium text-foreground">₹{item.price}</td>
                            <td className="px-3 py-2.5 text-muted-foreground">{item.stock}</td>
                            <td className="px-3 py-2.5">
                              {item.action === 'error' ? (
                                <ul className="list-disc list-inside text-error-400 space-y-0.5">
                                  {item.errors?.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                  ))}
                                </ul>
                              ) : item.changes && item.changes.length > 0 ? (
                                <div className="space-y-0.5 text-muted-foreground text-[11px]">
                                  {item.changes.map((change, idx) => (
                                    <div key={idx} className="flex items-center gap-1">
                                      <span>{change}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Ready for import</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-6 py-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>

          {previewResult && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{validItemsToImport.length}</span> of{' '}
                {previewResult.totalRows} rows ready to import
              </span>

              <Button
                variant="default"
                loading={executeMutation.isPending}
                disabled={validItemsToImport.length === 0}
                onClick={() => executeMutation.mutate(validItemsToImport)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Confirm & Import {validItemsToImport.length} Items
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
