import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  MapPin,
  Loader2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPageHeader, StatusIndicator } from '@/components/admin'
import { DataTable, TablePagination } from '@/components/admin/data-table'
import { useDebounce } from '@/hooks'
import {
  useAdminDeliveryPincodes,
  useCreateDeliveryPincode,
  useUpdateDeliveryPincode,
  useToggleDeliveryPincodeStatus,
  useDeleteDeliveryPincode,
} from '@/hooks'
import type { DeliveryPincode, DeliveryPincodeFormData } from '@/types'

// ─── Add/Edit Dialog ────────────────────────────────────────────────────────

function PincodeFormDialog({
  open,
  onClose,
  initialData,
  isEditing,
}: {
  open: boolean
  onClose: () => void
  initialData?: DeliveryPincode
  isEditing: boolean
}) {
  const [pincode, setPincode] = useState(initialData?.pincode || '')
  const [city, setCity] = useState(initialData?.city || '')
  const [state, setState] = useState(initialData?.state || '')
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)
  const [error, setError] = useState('')

  const createMutation = useCreateDeliveryPincode()
  const updateMutation = useUpdateDeliveryPincode()

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedPincode = pincode.trim()
    if (!/^[1-9]\d{5}$/.test(trimmedPincode)) {
      setError('Please enter a valid 6-digit Indian pincode')
      return
    }

    const data: DeliveryPincodeFormData = {
      pincode: trimmedPincode,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      isActive,
    }

    if (isEditing && initialData) {
      updateMutation.mutate(
        { id: initialData._id, data },
        {
          onSuccess: () => onClose(),
          onError: () => {},
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onClose(),
        onError: () => {},
      })
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl mx-4"
        >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-foreground">
            {isEditing ? 'Edit Delivery Pincode' : 'Add Delivery Pincode'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="dp-pincode" className="block text-sm font-medium text-foreground mb-1.5">
              Pincode <span className="text-destructive">*</span>
            </label>
            <Input
              id="dp-pincode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pincode}
              onChange={(e) => {
                setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))
                if (error) setError('')
              }}
              placeholder="e.g. 841224"
              required
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>

          <div>
            <label htmlFor="dp-city" className="block text-sm font-medium text-foreground mb-1.5">
              City
            </label>
            <Input
              id="dp-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Saran"
            />
          </div>

          <div>
            <label htmlFor="dp-state" className="block text-sm font-medium text-foreground mb-1.5">
              State
            </label>
            <Input
              id="dp-state"
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Bihar"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                isActive ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <label className="text-sm font-medium text-foreground cursor-pointer" onClick={() => setIsActive(!isActive)}>
              {isActive ? 'Active' : 'Inactive'}
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Adding...'}
                </>
              ) : isEditing ? (
                'Update Pincode'
              ) : (
                'Add Pincode'
              )}
            </Button>
          </div>
        </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ─── Delete Confirmation Dialog ─────────────────────────────────────────────

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  pincode,
  isPending,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  pincode: string
  isPending: boolean
}) {
  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl mx-4"
        >
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Delete delivery pincode {pincode}?
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          This action will remove this pincode from the serviceable delivery areas. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="flex-1"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// ─── Admin Page ─────────────────────────────────────────────────────────────

export default function DeliveryPincodesAdminPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 400)
  const limit = 20

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DeliveryPincode | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<DeliveryPincode | null>(null)

  const { data, isLoading } = useAdminDeliveryPincodes({
    page,
    limit,
    search: debouncedSearch || undefined,
  })

  const toggleStatusMutation = useToggleDeliveryPincodeStatus()
  const deleteMutation = useDeleteDeliveryPincode()

  const pincodes = data?.data ?? []
  const pagination = data?.pagination

  const handleAdd = () => {
    setEditingItem(undefined)
    setFormOpen(true)
  }

  const handleEdit = (item: DeliveryPincode) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingItem(undefined)
  }

  const handleToggle = (item: DeliveryPincode) => {
    toggleStatusMutation.mutate({ id: item._id, isActive: !item.isActive })
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const columns = [
    {
      key: 'pincode',
      header: 'Pincode',
      render: (row: Record<string, unknown>) => {
        const item = row as unknown as DeliveryPincode
        return (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="font-mono font-medium text-foreground">{item.pincode}</span>
          </div>
        )
      },
    },
    {
      key: 'city',
      header: 'City',
      render: (row: Record<string, unknown>) => {
        const item = row as unknown as DeliveryPincode
        return <span className="text-foreground">{item.city || '—'}</span>
      },
    },
    {
      key: 'state',
      header: 'State',
      render: (row: Record<string, unknown>) => {
        const item = row as unknown as DeliveryPincode
        return <span className="text-foreground">{item.state || '—'}</span>
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: Record<string, unknown>) => {
        const item = row as unknown as DeliveryPincode
        return <StatusIndicator status={item.isActive ? 'active' : 'inactive'} />
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (row: Record<string, unknown>) => {
        const item = row as unknown as DeliveryPincode
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleEdit(item)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleToggle(item)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title={item.isActive ? 'Disable' : 'Enable'}
            >
              {item.isActive ? (
                <PowerOff className="h-3.5 w-3.5" />
              ) : (
                <Power className="h-3.5 w-3.5 text-success-600" />
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(item)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-950/30 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Delivery Pincodes"
        description="Manage serviceable delivery areas. Active pincodes allow customers to place orders."
        action={
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Add Pincode
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-4">
        <div className="max-w-sm">
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            placeholder="Search by pincode, city, or state..."
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={pincodes as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        emptyMessage="No delivery pincodes found. Add your first pincode to get started."
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <TablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.totalResults}
          limit={pagination.limit}
          onPageChange={setPage}
          className="mt-4"
        />
      )}

      {/* Add/Edit Dialog */}
      <PincodeFormDialog
        open={formOpen}
        onClose={handleFormClose}
        initialData={editingItem}
        isEditing={!!editingItem}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        pincode={deleteTarget?.pincode || ''}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
