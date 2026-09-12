import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Pencil, Trash2, X, Upload, Building2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { workshopApi, uploadApi } from '@/services'
import { DataTable, AdminPageHeader, StatusIndicator } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { Loader } from '@/components/ui/loader'
import { ErrorFallback } from '@/components/ui/error'
import { modalOverlayVariants, modalContentVariants } from '@/config/animations'
import type { WorkshopExperience, WorkshopExperienceFormData } from '@/types'

interface ApiError {
  response?: { data?: { message?: string } }
}

const emptyForm: WorkshopExperienceFormData = {
  name: '',
  logo: { url: '', publicId: '' },
  displayOrder: 0,
  isActive: true,
}

export default function AdminWorkshopExperiencePage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WorkshopExperience | null>(null)
  const [form, setForm] = useState<WorkshopExperienceFormData>(emptyForm)
  const [uploading, setUploading] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'workshop-experience'],
    queryFn: async () => (await workshopApi.getAdminAllExperience()).data.data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'workshop-experience'] })

  const createMutation = useMutation({
    mutationFn: (payload: WorkshopExperienceFormData) => workshopApi.createExperience(payload),
    onSuccess: () => {
      toast.success('Institution added to Our Experience')
      invalidate()
      closeModal()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to add institution'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<WorkshopExperienceFormData> }) =>
      workshopApi.updateExperience(id, payload),
    onSuccess: () => {
      toast.success('Institution updated')
      invalidate()
      closeModal()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to update institution'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workshopApi.deleteExperience(id),
    onSuccess: () => {
      toast.success('Institution removed')
      invalidate()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to remove institution'),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (item: WorkshopExperience) => {
    setEditing(item)
    setForm({
      name: item.name,
      logo: item.logo,
      displayOrder: item.displayOrder,
      isActive: item.isActive,
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
      setForm((f) => ({
        ...f,
        logo: { url: res.data.data.url, publicId: res.data.data.publicId },
      }))
      toast.success('Logo uploaded successfully')
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || 'Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Institution name is required')
      return
    }
    if (!form.logo?.url) {
      toast.error('Please upload an organization logo')
      return
    }

    const payload: WorkshopExperienceFormData = {
      name: form.name.trim(),
      logo: form.logo,
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive ?? true,
    }

    if (editing) {
      updateMutation.mutate({ id: editing._id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (item: WorkshopExperience) => {
    if (window.confirm(`Remove "${item.name}" from Our Experience?`)) {
      deleteMutation.mutate(item._id)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Institution',
      render: (row: WorkshopExperience) => (
        <div className="flex items-center gap-3">
          {row.logo?.url ? (
            <img
              src={row.logo.url}
              alt={row.name}
              className="h-10 w-10 rounded-lg object-contain bg-muted p-1 border border-border"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted border border-border">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'displayOrder',
      header: 'Order',
      render: (row: WorkshopExperience) => <span className="font-mono text-sm">{row.displayOrder}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: WorkshopExperience) => (
        <StatusIndicator status={row.isActive ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row: WorkshopExperience) => (
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

  if (isLoading) return <Loader fullScreen text="Loading institutions..." />
  if (isError) return <ErrorFallback error={error as Error} resetErrorBoundary={refetch} />

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <AdminPageHeader
        title="Our Experience"
        description="Manage institutions and colleges where ShortCircuit has conducted workshops (logo and name only)."
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Institution
          </Button>
        }
      />

      <DataTable
        columns={columns as never}
        data={(data ?? []) as never}
        isLoading={isLoading}
        emptyMessage="No institutions added yet. Once a workshop is completed, add the institution here to showcase it."
      />

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalOverlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              variants={modalContentVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <h2 className="text-lg font-bold font-heading text-foreground">
                  {editing ? 'Edit Institution' : 'Add Institution to Experience'}
                </h2>
                <Button variant="ghost" size="icon-sm" onClick={closeModal} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Institution Name" required>
                  <Input
                    placeholder="e.g. ABC College of Engineering"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </FormField>

                <FormField label="Organization Logo" required>
                  <div className="space-y-3">
                    {form.logo?.url ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/40">
                        <img
                          src={form.logo.url}
                          alt="Logo Preview"
                          className="h-12 w-12 rounded object-contain bg-card p-1 border border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground truncate">Logo uploaded</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setForm({ ...form, logo: { url: '', publicId: '' } })}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
                        {uploading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : (
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        )}
                        <span className="text-xs font-medium text-foreground">
                          {uploading ? 'Uploading logo...' : 'Click to upload logo (PNG, WEBP, JPEG)'}
                        </span>
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
                    )}
                  </div>
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Display Order">
                    <Input
                      type="number"
                      value={form.displayOrder}
                      onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                    />
                  </FormField>

                  <div className="flex items-center pt-7">
                    <Checkbox
                      id="isActiveExperience"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    <label
                      htmlFor="isActiveExperience"
                      className="ml-2 text-sm text-foreground cursor-pointer select-none"
                    >
                      Active / Published
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={closeModal} disabled={isSaving || uploading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving || uploading}>
                    {isSaving ? 'Saving...' : editing ? 'Update' : 'Add Institution'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
