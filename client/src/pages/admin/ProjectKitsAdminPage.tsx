import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Cpu,
  Eye,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadApi, productApi } from '@/services'
import {
  useAdminProjectKits,
  useCreateProjectKit,
  useUpdateProjectKit,
  useDeleteProjectKit
} from '@/hooks/useProjectKits'
import { TablePagination, AdminPageHeader, StatusIndicator } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { Loader } from '@/components/ui/loader'
import { EmptyState } from '@/components/ui/error'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { modalOverlayVariants, modalContentVariants } from '@/config/animations'
import type { ProjectKit, ProjectKitFormData, Product, CloudinaryAsset } from '@/types'

const LIMIT = 10

const APPLICATION_AREAS = [
  'IoT',
  'Robotics',
  'Drones',
  'Home Automation',
  'Wearables',
  'Industrial',
  'Education',
  'Prototyping',
  'Agriculture',
  'Healthcare',
  'Automotive',
  'Environmental Monitoring',
]

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

interface FormState {
  name: string
  description: string
  shortDescription: string
  coverImage?: CloudinaryAsset
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  applicationArea: string
  tags: string
  estimatedTime: string
  pdfUrl: string
  components: {
    product: Product
    quantity: number
    note: string
    isOptional: boolean
  }[]
  isActive: boolean
  isFeatured: boolean
  displayOrder: number
}

const emptyForm: FormState = {
  name: '',
  description: '',
  shortDescription: '',
  difficulty: 'beginner',
  applicationArea: 'Robotics',
  tags: '',
  estimatedTime: '',
  pdfUrl: '',
  components: [],
  isActive: true,
  isFeatured: false,
  displayOrder: 0,
}

// Helper to convert GDrive sharing URL to Direct Image stream URL
function cleanDriveUrl(url: string): string {
  if (!url) return ''
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`
  }
  return url
}

export default function ProjectKitsAdminPage() {
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectKit | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'bom'>('basic')

  // Product search states for BOM association
  const [productQuery, setProductQuery] = useState('')
  const [foundProducts, setFoundProducts] = useState<Product[]>([])
  const [searchingProducts, setSearchingProducts] = useState(false)

  // API query
  const { data, isLoading, refetch } = useAdminProjectKits({ page, limit: LIMIT })

  // Mutations
  const createMutation = useCreateProjectKit()
  const updateMutation = useUpdateProjectKit()
  const deleteMutation = useDeleteProjectKit()

  // Handle product lookup
  useEffect(() => {
    if (!productQuery.trim()) {
      const timer = setTimeout(() => {
        setFoundProducts([])
      }, 0)
      return () => clearTimeout(timer)
    }

    const delay = setTimeout(async () => {
      setSearchingProducts(true)
      try {
        const res = await productApi.getAll({ search: productQuery, limit: 5 })
        setFoundProducts(res.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setSearchingProducts(false)
      }
    }, 400)

    return () => clearTimeout(delay)
  }, [productQuery])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setActiveFormTab('basic')
    setModalOpen(true)
  }

  const openEdit = (kit: ProjectKit) => {
    setEditing(kit)
    setForm({
      name: kit.name,
      description: kit.description,
      shortDescription: kit.shortDescription || '',
      coverImage: kit.coverImage,
      difficulty: kit.difficulty,
      applicationArea: kit.applicationArea,
      tags: kit.tags ? kit.tags.join(', ') : '',
      estimatedTime: kit.estimatedTime || '',
      pdfUrl: kit.documents?.[0]?.url || '',
      components: kit.components.map((c) => ({
        product: c.product,
        quantity: c.quantity,
        note: c.note || '',
        isOptional: c.isOptional || false,
      })),
      isActive: kit.isActive,
      isFeatured: kit.isFeatured,
      displayOrder: kit.displayOrder || 0,
    })
    setActiveFormTab('basic')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const res = await uploadApi.image(file)
      setForm((f) => ({
        ...f,
        coverImage: { url: res.data.data.url, publicId: res.data.data.publicId },
      }))
      toast.success('Cover image uploaded')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handlePdfUpload = async (file: File) => {
    setUploadingPdf(true)
    try {
      const res = await uploadApi.pdf(file)
      setForm((f) => ({
        ...f,
        pdfUrl: res.data.data.url,
      }))
      toast.success('PDF guide uploaded successfully')
    } catch {
      toast.error('PDF upload failed')
    } finally {
      setUploadingPdf(false)
    }
  }

  // BOM helpers
  const addProductToBOM = (prod: Product) => {
    // Check if already added
    if (form.components.some((c) => c.product._id === prod._id)) {
      toast.error('Product already added to BOM')
      return
    }
    setForm((f) => ({
      ...f,
      components: [...f.components, { product: prod, quantity: 1, note: '', isOptional: false }],
    }))
    setProductQuery('')
    setFoundProducts([])
  }

  const removeProductFromBOM = (idx: number) => {
    setForm((f) => ({
      ...f,
      components: f.components.filter((_, i) => i !== idx),
    }))
  }

  const updateBOMQuantity = (idx: number, qty: number) => {
    const safeQty = Math.max(1, Math.min(50, qty))
    setForm((f) => {
      const next = [...f.components]
      next[idx].quantity = safeQty
      return { ...f, components: next }
    })
  }

  const updateBOMNote = (idx: number, note: string) => {
    setForm((f) => {
      const next = [...f.components]
      next[idx].note = note
      return { ...f, components: next }
    })
  }

  const toggleBOMOptional = (idx: number) => {
    setForm((f) => {
      const next = [...f.components]
      next[idx].isOptional = !next[idx].isOptional
      return { ...f, components: next }
    })
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Project Name is required')
      return
    }
    if (!form.description.trim()) {
      toast.error('Description is required')
      return
    }
    if (!form.coverImage?.url) {
      toast.error('Cover image is required')
      return
    }
    if (form.components.length === 0) {
      toast.error('Add at least one product component to the BOM')
      return
    }

    // Process tag string to string[]
    const tagArray = form.tags
      ? form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : []

    // Compile payload
    const payload: ProjectKitFormData = {
      name: form.name.trim(),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim() || undefined,
      coverImage: form.coverImage,
      difficulty: form.difficulty,
      applicationArea: form.applicationArea,
      tags: tagArray,
      estimatedTime: form.estimatedTime.trim() || undefined,
      components: form.components.map((c) => ({
        product: c.product._id,
        quantity: c.quantity,
        note: c.note.trim() || undefined,
        isOptional: c.isOptional,
      })),
      instructions: [],
      wiringDiagrams: [],
      documents: form.pdfUrl.trim()
        ? [
            {
              title: `${form.name.trim()} Guide PDF`,
              url: cleanDriveUrl(form.pdfUrl.trim()),
              type: 'schematic',
            },
          ]
        : [],
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      displayOrder: Number(form.displayOrder),
    }

    if (editing) {
      updateMutation.mutate(
        { id: editing._id, data: payload },
        {
          onSuccess: () => {
            closeModal()
            refetch()
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          closeModal()
          refetch()
        },
      })
    }
  }

  const handleDelete = (kit: ProjectKit) => {
    if (window.confirm(`Delete project kit "${kit.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(kit._id, {
        onSuccess: () => refetch(),
      })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const kits = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="py-6">
      <AdminPageHeader
        title="Smart Project Kits"
        description="Manage student engineering kits, step-by-step instructions, wiring schematics, and BOM catalog pairings."
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate} className="rounded-2xl">
            Create Project Kit
          </Button>
        }
      />

      {/* Main Grid Catalog */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader text="Loading project kits..." />
        </div>
      ) : kits.length === 0 ? (
        <EmptyState
          icon={<Cpu className="h-7 w-7 text-muted-foreground" />}
          title="No project kits found"
          description="Create your first curated engineering project kit for students and makers."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate} className="rounded-2xl">
              Create Project Kit
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {kits.map((kit) => (
            <div
              key={kit._id}
              className="flex flex-col h-full rounded-3xl border border-border bg-card overflow-hidden shadow hover:shadow-lg transition-all"
            >
              <div className="relative aspect-video bg-muted border-b border-border">
                {kit.coverImage?.url ? (
                  <img src={kit.coverImage.url} alt={kit.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Eye className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <StatusIndicator status={kit.isActive ? 'active' : 'inactive'} />
                </div>
                {kit.isFeatured && (
                  <Badge className="absolute top-3 right-3 bg-amber-500 text-white border-none">
                    ⭐ Featured
                  </Badge>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex gap-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">
                    <span>{kit.difficulty}</span>
                    <span>•</span>
                    <span>{kit.applicationArea}</span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground line-clamp-1 mb-1">{kit.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                    {kit.shortDescription || kit.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/80">
                  <div className="text-[10px] text-muted-foreground">
                    Order: <span className="font-bold">#{kit.displayOrder}</span> | Parts:{' '}
                    <span className="font-bold">{kit.components?.length || 0}</span>
                  </div>

                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(kit)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(kit)} className="text-error-500 hover:text-error-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 rounded-2xl border border-border bg-card">
          <TablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.totalResults}
            limit={pagination.limit}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Add / Edit Modal Drawer */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={modalOverlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col rounded-3xl border border-border bg-card shadow-2xl"
              variants={modalContentVariants}
            >
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {editing ? `Edit: ${editing.name}` : 'Create Smart Project Kit'}
                  </h2>
                  <p className="text-xs text-muted-foreground">Fill in details, components BOM, build guide timelines.</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={closeModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Form tabs */}
              <div className="flex border-b border-border bg-muted/10 px-6">
                {([
                  { id: 'basic', label: '1. Basic Info' },
                  { id: 'bom', label: '2. Components BOM' },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFormTab(tab.id)}
                    className={`py-3.5 px-4 text-xs font-bold border-b-2 -mb-[1px] transition-colors ${
                      activeFormTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Form Scrollable Area */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* ─── TAB 1: BASIC DETAILS ─── */}
                {activeFormTab === 'basic' && (
                  <div className="space-y-4">
                    <FormField label="Project Name" required>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. WiFi Smart Irrigation Controller"
                        required
                      />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Difficulty Level" required>
                        <Select
                          value={form.difficulty}
                          onChange={(e) => setForm({ ...form, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                        >
                          {DIFFICULTIES.map((d) => (
                            <option key={d} value={d}>
                              {d.toUpperCase()}
                            </option>
                          ))}
                        </Select>
                      </FormField>

                      <FormField label="Application Domain Area" required>
                        <Select
                          value={form.applicationArea}
                          onChange={(e) => setForm({ ...form, applicationArea: e.target.value })}
                        >
                          {APPLICATION_AREAS.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Estimated Assembly Duration">
                        <Input
                          value={form.estimatedTime}
                          onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })}
                          placeholder="e.g. 2-3 hours"
                        />
                      </FormField>
                      <FormField label="Sort / Display Order Position">
                        <Input
                          type="number"
                          value={form.displayOrder}
                          onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </FormField>
                    </div>

                    <FormField label="Tags / Keywords (comma separated)">
                      <Input
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        placeholder="e.g. esp8266, pump, agriculture, sensor"
                      />
                    </FormField>

                    <FormField label="Project Guide PDF (Upload file or paste Google Drive URL)" required>
                      <div className="space-y-3">
                        <Input
                          value={form.pdfUrl}
                          onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
                          placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing or uploaded PDF URL"
                          required
                        />
                        <div className="flex items-center gap-4">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-input bg-background px-4 py-2 text-xs hover:bg-muted font-bold transition-all shadow-sm">
                            <Upload className="h-4 w-4" />
                            {uploadingPdf ? 'Uploading PDF...' : 'Upload PDF File'}
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              disabled={uploadingPdf}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handlePdfUpload(file)
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </FormField>

                    <FormField label="Short Description Summary" required>
                      <Input
                        value={form.shortDescription}
                        onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                        placeholder="A concise, one-liner explanation of the project."
                        required
                      />
                    </FormField>

                    <FormField label="Full Construction Description (Markdown)" required>
                      <Textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Detailed background, utility context, and parts setup overview."
                        className="min-h-[120px]"
                        required
                      />
                    </FormField>

                    <FormField label="Project Cover Photo" required>
                      <div className="flex items-center gap-4">
                        {form.coverImage?.url && (
                          <img
                            src={form.coverImage.url}
                            alt="preview"
                            className="h-16 w-28 rounded-2xl object-cover border border-border"
                          />
                        )}
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-input bg-background px-4 py-2 text-xs hover:bg-muted font-bold transition-all shadow-sm">
                          <Upload className="h-4 w-4" />
                          {uploading ? 'Uploading...' : 'Upload Image to Cloudinary'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(file)
                            }}
                          />
                        </label>
                      </div>
                    </FormField>

                    <div className="flex gap-6 items-center pt-2">
                      <Checkbox
                        label="Active and Publicly Visible"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      />
                      <Checkbox
                        label="Feature on Homepage"
                        checked={form.isFeatured}
                        onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                      />
                    </div>
                  </div>
                )}

                {/* ─── TAB 2: BOM COMPONENTS ─── */}
                {activeFormTab === 'bom' && (
                  <div className="space-y-6">
                    <div className="bg-muted/10 border border-border p-4 rounded-3xl space-y-3 relative">
                      <span className="text-xs font-bold text-foreground">🔍 Add Products to BOM</span>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={productQuery}
                          onChange={(e) => setProductQuery(e.target.value)}
                          placeholder="Type item name or SKU to search store inventory..."
                          className="pl-9"
                        />
                      </div>

                      {/* Dropdown suggestions */}
                      {searchingProducts && <div className="text-xs text-muted-foreground mt-2">Searching...</div>}
                      {foundProducts.length > 0 && (
                        <div className="absolute left-4 right-4 z-20 mt-1 max-h-52 overflow-y-auto rounded-2xl border border-border bg-card shadow-lg p-2 space-y-1">
                          {foundProducts.map((p) => (
                            <button
                              key={p._id}
                              type="button"
                              onClick={() => addProductToBOM(p)}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-muted font-medium flex items-center justify-between"
                            >
                              <span>{p.name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                SKU: {p.sku}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* BOM Table */}
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                        Configured BOM Products ({form.components.length})
                      </span>
                      {form.components.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-border rounded-3xl text-sm text-muted-foreground">
                          No products configured in BOM yet. Search and select products above.
                        </div>
                      ) : (
                        <div className="border border-border rounded-3xl overflow-hidden shadow-inner">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-muted/30 border-b border-border text-muted-foreground font-semibold">
                                <th className="p-3">Product</th>
                                <th className="p-3 w-20 text-center">Qty</th>
                                <th className="p-3">Optional</th>
                                <th className="p-3">Note for Students</th>
                                <th className="p-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {form.components.map((comp, idx) => (
                                <tr key={idx} className="hover:bg-muted/10">
                                  <td className="p-3 font-semibold text-foreground">
                                    <div>{comp.product.name}</div>
                                    <div className="text-[9px] text-muted-foreground font-mono">
                                      SKU: {comp.product.sku}
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Input
                                      type="number"
                                      value={comp.quantity}
                                      onChange={(e) => updateBOMQuantity(idx, Number(e.target.value))}
                                      className="h-8 w-14 text-center rounded-lg p-1 font-bold"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <button
                                      type="button"
                                      onClick={() => toggleBOMOptional(idx)}
                                      className={`px-2 py-1 rounded-full text-[9px] font-bold ${
                                        comp.isOptional
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                      }`}
                                    >
                                      {comp.isOptional ? 'Optional' : 'Required'}
                                    </button>
                                  </td>
                                  <td className="p-3">
                                    <Input
                                      value={comp.note}
                                      onChange={(e) => updateBOMNote(idx, e.target.value)}
                                      placeholder="e.g. Any 10k resistor works"
                                      className="h-8 text-xs"
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => removeProductFromBOM(idx)}
                                      className="text-error-500 hover:text-error-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </form>

              {/* Action Buttons */}
              <div className="p-6 border-t border-border flex justify-end gap-2 bg-muted/20">
                <Button type="button" variant="outline" onClick={closeModal} className="rounded-2xl">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} loading={isSaving} className="rounded-2xl">
                  {editing ? 'Save Changes' : 'Create Project Kit'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
