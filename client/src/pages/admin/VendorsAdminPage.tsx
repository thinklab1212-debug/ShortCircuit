import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, X } from 'lucide-react'
import { adminVendorApi } from '@/services/vendorApi'
import { AdminPageHeader } from '@/components/admin'
import { Badge } from '@/components/ui/badge'
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
    </div>
  )
}
