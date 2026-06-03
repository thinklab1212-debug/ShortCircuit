import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Upload, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { bannerApi, uploadApi } from '@/services'
import { TablePagination, AdminPageHeader, StatusIndicator } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { Loader } from '@/components/ui/loader'
import { EmptyState, ErrorFallback } from '@/components/ui/error'
import { modalOverlayVariants, modalContentVariants } from '@/config/animations'
import { formatDate } from '@/utils'
import type { Banner, BannerFormData, CloudinaryAsset } from '@/types'

interface ApiError {
  response?: { data?: { message?: string } }
}

const LIMIT = 12

interface FormState {
  title: string
  subtitle: string
  description: string
  link: string
  linkText: string
  position: number
  isActive: boolean
  startDate: string
  endDate: string
  image?: CloudinaryAsset
}

const emptyForm: FormState = {
  title: '',
  subtitle: '',
  description: '',
  link: '',
  linkText: '',
  position: 0,
  isActive: true,
  startDate: '',
  endDate: '',
}

function toDateInput(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function BannersAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [uploading, setUploading] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'banners', page],
    queryFn: async () => (await bannerApi.getAll({ page, limit: LIMIT })).data,
    placeholderData: keepPreviousData,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })

  const createMutation = useMutation({
    mutationFn: (payload: BannerFormData) => bannerApi.create(payload),
    onSuccess: () => {
      toast.success('Banner created')
      invalidate()
      closeModal()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to create banner'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BannerFormData> }) =>
      bannerApi.update(id, payload),
    onSuccess: () => {
      toast.success('Banner updated')
      invalidate()
      closeModal()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to update banner'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannerApi.remove(id),
    onSuccess: () => {
      toast.success('Banner deleted')
      invalidate()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to delete banner'),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (banner: Banner) => {
    setEditing(banner)
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      link: banner.link || '',
      linkText: banner.linkText || '',
      position: banner.position ?? 0,
      isActive: banner.isActive,
      startDate: toDateInput(banner.startDate),
      endDate: toDateInput(banner.endDate),
      image: banner.image,
    })
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
      setForm((f) => ({ ...f, image: { url: res.data.data.url, publicId: res.data.data.publicId } }))
      toast.success('Image uploaded')
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!form.image?.url) {
      toast.error('Banner image is required')
      return
    }
    const payload: BannerFormData = {
      title: form.title.trim(),
      subtitle: form.subtitle || undefined,
      description: form.description || undefined,
      link: form.link || undefined,
      linkText: form.linkText || undefined,
      position: Number(form.position),
      isActive: form.isActive,
      image: form.image,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
    }
    if (editing) {
      updateMutation.mutate({ id: editing._id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (banner: Banner) => {
    if (window.confirm(`Delete banner "${banner.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(banner._id)
    }
  }

  if (isError) return <ErrorFallback error={error as Error} resetErrorBoundary={refetch} />

  const banners = data?.data ?? []
  const pagination = data?.pagination
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <AdminPageHeader
        title="Banners"
        description="Manage promotional banners shown on the storefront."
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add Banner
          </Button>
        }
      />

      {isLoading && !data ? (
        <div className="py-12">
          <Loader text="Loading banners…" />
        </div>
      ) : banners.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="h-7 w-7 text-muted-foreground" />}
          title="No banners yet"
          description="Add your first promotional banner to display on the storefront."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add Banner
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <div
              key={banner._id}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[16/9] bg-muted">
                {banner.image?.url ? (
                  <img src={banner.image.url} alt={banner.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute left-2 top-2">
                  <StatusIndicator status={banner.isActive ? 'active' : 'inactive'} />
                </div>
                <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                  #{banner.position}
                </span>
              </div>
              <div className="space-y-2 p-4">
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-1">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{banner.subtitle}</p>
                  )}
                </div>
                {(banner.startDate || banner.endDate) && (
                  <p className="text-xs text-muted-foreground">
                    {banner.startDate ? formatDate(banner.startDate) : '—'} →{' '}
                    {banner.endDate ? formatDate(banner.endDate) : '—'}
                  </p>
                )}
                <div className="flex items-center justify-end gap-1 pt-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(banner)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(banner)}
                    aria-label="Delete"
                    className="text-error-500 hover:text-error-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 rounded-xl border border-border bg-card">
          <TablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.totalResults}
            limit={pagination.limit}
            onPageChange={setPage}
          />
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={modalOverlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl"
              variants={modalContentVariants}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {editing ? 'Edit Banner' : 'Add Banner'}
                </h2>
                <Button variant="ghost" size="icon-sm" onClick={closeModal} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Title" required>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Summer Sale"
                  />
                </FormField>

                <FormField label="Subtitle">
                  <Input
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="Optional subtitle"
                  />
                </FormField>

                <FormField label="Description">
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Link URL">
                    <Input
                      value={form.link}
                      onChange={(e) => setForm({ ...form, link: e.target.value })}
                      placeholder="/products"
                    />
                  </FormField>
                  <FormField label="Link Text">
                    <Input
                      value={form.linkText}
                      onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                      placeholder="Shop Now"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Position">
                    <Input
                      type="number"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
                    />
                  </FormField>
                  <FormField label="Start Date">
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </FormField>
                  <FormField label="End Date">
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </FormField>
                </div>

                <FormField label="Image" required>
                  <div className="flex items-center gap-3">
                    {form.image?.url && (
                      <img src={form.image.url} alt="preview" className="h-14 w-24 rounded-lg object-cover" />
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading…' : 'Upload Image'}
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

                <Checkbox
                  label="Active"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSaving}>
                    {editing ? 'Save Changes' : 'Create Banner'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
