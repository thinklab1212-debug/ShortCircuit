import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, X, KeyRound } from 'lucide-react'
import { adminVendorApi } from '@/services/vendorApi'
import { AdminPageHeader } from '@/components/admin'
import { ErrorFallback } from '@/components/ui/error'
import { Skeleton } from '@/components/ui/loader'
import { formatDate } from '@/utils'
import { toast } from 'sonner'
import type { CreateVendorData, VendorProfile, User } from '@/types'

// ─── Admin Vendors Page ─────────────────────────────────────────────────────────

const initialCreateForm: CreateVendorData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  businessName: '',
  contactPerson: '',
  phone: '',
  gstin: '',
}

export default function VendorsAdminPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateVendorData>(initialCreateForm)
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'vendors', page],
    queryFn: () => adminVendorApi.getVendors({ page, limit: 20 }).then((res) => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateVendorData) => adminVendorApi.createVendor(data),
    onSuccess: () => {
      toast.success('Vendor account created successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'vendors'] })
      setShowCreate(false)
      setForm(initialCreateForm)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create vendor')
    },
  })

  const [confirmResetVendor, setConfirmResetVendor] = useState<{ id: string; name: string } | null>(null)
  const [resetPasswordData, setResetPasswordData] = useState<{ businessName: string; password: string } | null>(null)

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id }: { id: string; name: string }) => adminVendorApi.resetPassword(id).then((res) => res.data),
    onSuccess: (data, variables) => {
      toast.success('Credentials reset successfully')
      setResetPasswordData({
        businessName: variables.name,
        password: data.data.password,
      })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to reset vendor credentials')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  if (isError) {
    return <ErrorFallback error={error as Error} resetErrorBoundary={() => void refetch()} />
  }

  const vendors: VendorProfile[] = data?.data ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Vendor Management"
        description="Create and manage vendor accounts"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Vendor
          </button>
        }
      />

      {/* Create Vendor Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative z-10 w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Create Vendor Account</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">First Name *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Last Name *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Temporary Password *</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Min 8 characters"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Business Name *</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Contact Person *</label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                    required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Phone *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    required
                    pattern="[6-9]\d{9}"
                    title="10-digit Indian phone number"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">GSTIN</label>
                <input
                  type="text"
                  value={form.gstin || ''}
                  onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
                  maxLength={15}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Optional"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendors Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No vendors yet. Create the first vendor account.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3 hidden sm:table-cell">Contact</th>
                <th className="px-4 py-3 hidden md:table-cell">Email</th>
                <th className="px-4 py-3 hidden lg:table-cell">Phone</th>
                <th className="px-4 py-3 hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vendors.map((vendor) => {
                const user = vendor.user as User | undefined
                return (
                  <tr key={vendor._id} className="transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{vendor.businessName}</p>
                      {vendor.gstin && (
                        <p className="text-xs text-muted-foreground">GSTIN: {vendor.gstin}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm text-foreground">
                      {vendor.contactPerson}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">
                      {user?.email || '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                      {vendor.phone}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                      {formatDate(vendor.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setConfirmResetVendor({ id: vendor._id, name: vendor.businessName })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                      >
                        Reset Credentials
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevPage}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNextPage}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmResetVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmResetVendor(null)} />
          <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Reset Vendor Credentials</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reset the credentials for <strong>{confirmResetVendor.name}</strong>? This will immediately invalidate their current password.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetVendor(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const vendorId = confirmResetVendor.id
                  const vendorName = confirmResetVendor.name
                  setConfirmResetVendor(null)
                  resetPasswordMutation.mutate({ id: vendorId, name: vendorName })
                }}
                disabled={resetPasswordMutation.isPending}
                className="rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Yes, Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success / Show Password Modal */}
      {resetPasswordData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-warning">
              <KeyRound className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Credentials Reset</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Here is the new temporary password for <strong>{resetPasswordData.businessName}</strong>. 
              This will only be displayed <strong>once</strong>. Please copy it now:
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3 font-mono text-sm border border-border justify-between">
              <span className="select-all font-bold text-foreground">{resetPasswordData.password}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(resetPasswordData.password)
                  toast.success('Password copied to clipboard')
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Copy
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setResetPasswordData(null)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Close & Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
