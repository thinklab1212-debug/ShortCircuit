import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Upload, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { brandApi, uploadApi } from '@/services'
import { DataTable, AdminPageHeader, StatusIndicator } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { Loader } from '@/components/ui/loader'
import { ErrorFallback } from '@/components/ui/error'
import { modalOverlayVariants, modalContentVariants } from '@/config/animations'
import type { Brand, BrandFormData } from '@/types'

interface ApiError {
  response?: { data?: { message?: string } }
}

const emptyForm: BrandFormData = {
  name: '',
  description: '',
  website: '',
  countryOfOrigin: '',
  isActive: true,
}

export default function BrandsAdminPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [form, setForm] = useState<BrandFormData>(emptyForm)
  const [uploading, setUploading] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'brands'],
    queryFn: async () => (await brandApi.getAdminAll()).data.data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] })

  const createMutation = useMutation({
    mutationFn: (payload: BrandFormData) => brandApi.create(payload),
    onSuccess: () => {
      toast.success('Brand created')
      invalidate()
      closeModal()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to create brand'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BrandFormData> }) =>
      brandApi.update(id, payload),
    onSuccess: () => {
      toast.success('Brand updated')
      invalidate()
      closeModal()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to update brand'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => brandApi.remove(id),
    onSuccess: () => {
      toast.success('Brand deleted')
      invalidate()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to delete brand'),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (brand: Brand) => {
    setEditing(brand)
    setForm({
      name: brand.name,
      description: brand.description || '',
      website: brand.website || '',
      countryOfOrigin: brand.countryOfOrigin || '',
      isActive: brand.isActive,
      logo: brand.logo,
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
      setForm((f) => ({ ...f, logo: { url: res.data.data.url, publicId: res.data.data.publicId } }))
      toast.success('Logo uploaded')
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }

    const payload = {
      ...form,
      website: form.website?.trim() || undefined,
      description: form.description?.trim() || undefined,
      countryOfOrigin: form.countryOfOrigin?.trim() || undefined,
    }

    if (editing) {
      updateMutation.mutate({ id: editing._id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (brand: Brand) => {
    if (window.confirm(`Delete brand "${brand.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(brand._id)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Brand',
      render: (row: Brand) => (
        <div className="flex items-center gap-3">
          {row.logo?.url ? (
            <img src={row.logo.url} alt={row.name} className="h-9 w-9 rounded-lg object-contain bg-muted p-1" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (row: Brand) => <span className="text-muted-foreground">{row.slug}</span>,
    },
    {
      key: 'countryOfOrigin',
      header: 'Country',
      render: (row: Brand) => <span>{row.countryOfOrigin || '—'}</span>,
    },
    {
      key: 'productCount',
      header: 'Products',
      render: (row: Brand) => <span>{row.productCount ?? 0}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: Brand) => <StatusIndicator status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row: Brand) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(row)} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(row)}
            aria-label="Delete"
            className="text-error-500 hover:text-error-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (isError) return <ErrorFallback error={error as Error} resetErrorBoundary={refetch} />

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <AdminPageHeader
        title="Brands"
        description="Manage product brands and manufacturers."
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add Brand
          </Button>
        }
      />

      <DataTable
        columns={columns as never}
        data={(data ?? []) as never}
        isLoading={isLoading}
        emptyMessage="No brands yet. Add your first brand."
      />

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
              className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl"
              variants={modalContentVariants}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {editing ? 'Edit Brand' : 'Add Brand'}
                </h2>
                <Button variant="ghost" size="icon-sm" onClick={closeModal} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Name" required>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Sony"
                  />
                </FormField>

                <FormField label="Description">
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Short description"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Website">
                    <Input
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="https://…"
                    />
                  </FormField>
                  <FormField label="Country of Origin">
                    <Input
                      value={form.countryOfOrigin}
                      onChange={(e) => setForm({ ...form, countryOfOrigin: e.target.value })}
                      placeholder="e.g. Japan"
                    />
                  </FormField>
                </div>

                <FormField label="Logo">
                  <div className="flex items-center gap-3">
                    {form.logo?.url && (
                      <img src={form.logo.url} alt="preview" className="h-12 w-12 rounded-lg object-contain bg-muted p-1" />
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                      <Upload className="h-4 w-4" />
                      {uploading ? 'Uploading…' : 'Upload Logo'}
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
                    {editing ? 'Save Changes' : 'Create Brand'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && !data && (
        <div className="py-12">
          <Loader text="Loading brands…" />
        </div>
      )}
    </div>
  )
}
