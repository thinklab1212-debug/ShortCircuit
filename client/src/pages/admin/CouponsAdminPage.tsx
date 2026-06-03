import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { couponApi } from '@/services'
import { DataTable, TablePagination, AdminPageHeader, StatusIndicator } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { ErrorFallback } from '@/components/ui/error'
import { modalOverlayVariants, modalContentVariants } from '@/config/animations'
import { formatPrice, formatDate } from '@/utils'
import type { Coupon, CouponFormData, DiscountType } from '@/types'

interface ApiError {
  response?: { data?: { message?: string } }
}

const LIMIT = 12

interface FormState {
  code: string
  description: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount: number
  maxDiscount: number | ''
  validFrom: string
  validUntil: string
  usageLimit: number
  perUserLimit: number
  isActive: boolean
}

const emptyForm: FormState = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  minOrderAmount: 0,
  maxDiscount: '',
  validFrom: '',
  validUntil: '',
  usageLimit: 100,
  perUserLimit: 1,
  isActive: true,
}

// Convert an ISO date string to a value usable by <input type="datetime-local">
function toLocalInput(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CouponsAdminPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'coupons', page],
    queryFn: async () => (await couponApi.getAll({ page, limit: LIMIT })).data,
    placeholderData: keepPreviousData,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })

  const createMutation = useMutation({
    mutationFn: (payload: CouponFormData) => couponApi.create(payload),
    onSuccess: () => {
      toast.success('Coupon created')
      invalidate()
      closeModal()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to create coupon'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CouponFormData> }) =>
      couponApi.update(id, payload),
    onSuccess: () => {
      toast.success('Coupon updated')
      invalidate()
      closeModal()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to update coupon'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponApi.remove(id),
    onSuccess: () => {
      toast.success('Coupon deleted')
      invalidate()
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message || 'Failed to delete coupon'),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount ?? 0,
      maxDiscount: coupon.maxDiscount ?? '',
      validFrom: toLocalInput(coupon.validFrom),
      validUntil: toLocalInput(coupon.validUntil),
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit ?? 1,
      isActive: coupon.isActive,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim()) {
      toast.error('Code is required')
      return
    }
    if (!form.validFrom || !form.validUntil) {
      toast.error('Validity dates are required')
      return
    }
    const payload: CouponFormData = {
      code: form.code.trim().toUpperCase(),
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount),
      maxDiscount: form.maxDiscount === '' ? undefined : Number(form.maxDiscount),
      validFrom: new Date(form.validFrom).toISOString(),
      validUntil: new Date(form.validUntil).toISOString(),
      usageLimit: Number(form.usageLimit),
      perUserLimit: Number(form.perUserLimit),
      isActive: form.isActive,
    }
    if (editing) {
      updateMutation.mutate({ id: editing._id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (coupon: Coupon) => {
    if (window.confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) {
      deleteMutation.mutate(coupon._id)
    }
  }

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (row: Coupon) => (
        <span className="font-mono font-semibold text-foreground">{row.code}</span>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (row: Coupon) => (
        <span>
          {row.discountType === 'percentage' ? `${row.discountValue}%` : formatPrice(row.discountValue)}
        </span>
      ),
    },
    {
      key: 'minOrderAmount',
      header: 'Min Order',
      render: (row: Coupon) => <span>{formatPrice(row.minOrderAmount)}</span>,
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (row: Coupon) => (
        <span className="text-muted-foreground">
          {row.usedCount}/{row.usageLimit}
        </span>
      ),
    },
    {
      key: 'validity',
      header: 'Validity',
      render: (row: Coupon) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.validFrom)} – {formatDate(row.validUntil)}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: Coupon) => <StatusIndicator status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row: Coupon) => (
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

  const coupons = data?.data ?? []
  const pagination = data?.pagination
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        description="Create and manage discount coupons."
        action={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Create Coupon
          </Button>
        }
      />

      <DataTable
        columns={columns as never}
        data={coupons as never}
        isLoading={isLoading}
        emptyMessage="No coupons yet. Create your first coupon."
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-2">
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
                  {editing ? 'Edit Coupon' : 'Create Coupon'}
                </h2>
                <Button variant="ghost" size="icon-sm" onClick={closeModal} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Code" required hint="3-20 uppercase alphanumeric">
                    <Input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="SAVE10"
                    />
                  </FormField>
                  <FormField label="Discount Type" required>
                    <Select
                      value={form.discountType}
                      onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (₹)</option>
                    </Select>
                  </FormField>
                </div>

                <FormField label="Description">
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label={form.discountType === 'percentage' ? 'Discount (%)' : 'Discount (₹)'} required>
                    <Input
                      type="number"
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    />
                  </FormField>
                  <FormField label="Max Discount (₹)" hint="Optional cap">
                    <Input
                      type="number"
                      value={form.maxDiscount}
                      onChange={(e) =>
                        setForm({ ...form, maxDiscount: e.target.value === '' ? '' : Number(e.target.value) })
                      }
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Min Order (₹)">
                    <Input
                      type="number"
                      value={form.minOrderAmount}
                      onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                    />
                  </FormField>
                  <FormField label="Usage Limit" required>
                    <Input
                      type="number"
                      value={form.usageLimit}
                      onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                    />
                  </FormField>
                  <FormField label="Per User Limit">
                    <Input
                      type="number"
                      value={form.perUserLimit}
                      onChange={(e) => setForm({ ...form, perUserLimit: Number(e.target.value) })}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Valid From" required>
                    <Input
                      type="datetime-local"
                      value={form.validFrom}
                      onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    />
                  </FormField>
                  <FormField label="Valid Until" required>
                    <Input
                      type="datetime-local"
                      value={form.validUntil}
                      onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    />
                  </FormField>
                </div>

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
                    {editing ? 'Save Changes' : 'Create Coupon'}
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
