import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Pencil, Trash2, X, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'
import { workshopApi } from '@/services'
import { DataTable, AdminPageHeader, StatusIndicator } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { Loader } from '@/components/ui/loader'
import { ErrorFallback } from '@/components/ui/error'
import { modalOverlayVariants, modalContentVariants } from '@/config/animations'
import type { Workshop, WorkshopFormData } from '@/types'

interface ApiError {
  response?: { data?: { message?: string } }
}

const emptyForm: WorkshopFormData = {
  title: '',
  description: '',
  category: 'Robotics',
  displayOrder: 0,
  isActive: true,
}

export default function AdminWorkshopsPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Workshop | null>(null)
  const [form, setForm] = useState<WorkshopFormData>(emptyForm)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'workshops'],
    queryFn: async () => (await workshopApi.getAdminAllWorkshops()).data.data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'workshops'] })

  const createMutation = useMutation({
    mutationFn: (payload: WorkshopFormData) => workshopApi.createWorkshop(payload),
    onSuccess: () => {
      toast.success('Workshop created')
      invalidate()
      closeModal()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to create workshop'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<WorkshopFormData> }) =>
      workshopApi.updateWorkshop(id, payload),
    onSuccess: () => {
      toast.success('Workshop updated')
      invalidate()
      closeModal()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to update workshop'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workshopApi.deleteWorkshop(id),
    onSuccess: () => {
      toast.success('Workshop deleted')
      invalidate()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to delete workshop'),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (workshop: Workshop) => {
    setEditing(workshop)
    setForm({
      title: workshop.title,
      description: workshop.description,
      category: workshop.category,
      displayOrder: workshop.displayOrder,
      isActive: workshop.isActive,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!form.description.trim()) {
      toast.error('Description is required')
      return
    }
    if (!form.category.trim()) {
      toast.error('Category is required')
      return
    }

    const payload: WorkshopFormData = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive ?? true,
    }

    if (editing) {
      updateMutation.mutate({ id: editing._id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (workshop: Workshop) => {
    if (window.confirm(`Delete workshop "${workshop.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(workshop._id)
    }
  }

  const columns = [
    {
      key: 'title',
      header: 'Workshop Program',
      render: (row: Workshop) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-medium text-foreground block">{row.title}</span>
            <span className="text-xs text-muted-foreground line-clamp-1 max-w-md">{row.description}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row: Workshop) => (
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-muted text-foreground border border-border">
          {row.category}
        </span>
      ),
    },
    {
      key: 'displayOrder',
      header: 'Order',
      render: (row: Workshop) => <span className="font-mono text-sm">{row.displayOrder}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: Workshop) => <StatusIndicator status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row: Workshop) => (
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

  if (isLoading) return <Loader fullScreen text="Loading workshops..." />
  if (isError) return <ErrorFallback error={error as Error} resetErrorBoundary={refetch} />

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <AdminPageHeader
        title="Workshops & Training"
        description="Manage image-free workshop cards shown on the public Workshops & Training page."
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Workshop
          </Button>
        }
      />

      <DataTable
        columns={columns as never}
        data={(data ?? []) as never}
        isLoading={isLoading}
        emptyMessage="No workshops configured yet. Click 'Add Workshop' to create one."
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
              className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <h2 className="text-lg font-bold font-heading text-foreground">
                  {editing ? 'Edit Workshop' : 'New Workshop Card'}
                </h2>
                <Button variant="ghost" size="icon-sm" onClick={closeModal} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Workshop Title" required>
                  <Input
                    placeholder="e.g. Robotics & Automation"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </FormField>

                <FormField label="Category / Tag" required>
                  <Input
                    placeholder="e.g. Robotics, IoT, Embedded Systems, Drones"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  />
                </FormField>

                <FormField label="Short Description" required>
                  <Textarea
                    placeholder="Describe the practical hands-on training provided in this workshop..."
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
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
                      id="isActive"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-foreground cursor-pointer select-none">
                      Active / Published
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={closeModal} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : editing ? 'Update Workshop' : 'Create Workshop'}
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
