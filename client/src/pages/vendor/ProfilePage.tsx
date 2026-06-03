import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Save, Building2 } from 'lucide-react'
import { vendorApi } from '@/services/vendorApi'
import { AdminPageHeader } from '@/components/admin'
import { ErrorFallback } from '@/components/ui/error'
import { Skeleton } from '@/components/ui/loader'
import { toast } from 'sonner'

// ─── Vendor Profile Page ────────────────────────────────────────────────────────

export default function ProfilePage() {
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    gstin: '',
  })

  const { data: profile, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vendor', 'profile'],
    queryFn: () => vendorApi.getProfile().then((res) => res.data.data),
  })

  useEffect(() => {
    if (profile) {
      setForm({
        businessName: profile.businessName || '',
        contactPerson: profile.contactPerson || '',
        phone: profile.phone || '',
        gstin: profile.gstin || '',
      })
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => vendorApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['vendor', 'profile'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update profile')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(form)
  }

  if (isError) {
    return <ErrorFallback error={error as Error} resetErrorBoundary={() => void refetch()} />
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Vendor Profile"
        description="Manage your business information"
      />

      {isLoading ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Business Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Business Name *</label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Contact Person *</label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">GSTIN</label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
                maxLength={15}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
