import { Store, User as UserIcon, ShieldCheck, Mail, Phone, Settings as SettingsIcon, Loader2 } from 'lucide-react'
import { AdminPageHeader, AdminSection } from '@/components/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { APP } from '@/constants'
import { getUserName, formatDate } from '@/utils'
import { useAuthStore } from '@/store'
import { useAdminSettings, useUpdateAdminSettings } from '@/hooks'

interface ToggleSetting {
  key: 'isMaintenanceMode' | 'codEnabled' | 'guestCheckoutEnabled' | 'emailNotificationsEnabled'
  label: string
  description: string
}

const TOGGLES: ToggleSetting[] = [
  { key: 'isMaintenanceMode', label: 'Maintenance mode', description: 'Temporarily take the storefront offline for visitors.' },
  { key: 'codEnabled', label: 'Allow Cash on Delivery', description: 'Let customers pay with cash when their order arrives.' },
  { key: 'guestCheckoutEnabled', label: 'Guest checkout', description: 'Allow customers to check out without an account.' },
  { key: 'emailNotificationsEnabled', label: 'Email notifications', description: 'Send order and account emails to customers.' },
]

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const { data: settings, isLoading } = useAdminSettings()
  const { mutate: updateSettings, isPending } = useUpdateAdminSettings()

  const currentValues = {
    isMaintenanceMode: settings?.isMaintenanceMode ?? false,
    codEnabled: settings?.codEnabled ?? true,
    guestCheckoutEnabled: settings?.guestCheckoutEnabled ?? false,
    emailNotificationsEnabled: settings?.emailNotificationsEnabled ?? true,
  }

  const handleToggle = (key: keyof typeof currentValues, checked: boolean) => {
    updateSettings({ [key]: checked })
  }

  return (
    <div>
      <AdminPageHeader title="Settings" description="Store information and live system preferences." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Store Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>Read-only application details.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Store Name" value={APP.NAME} />
            <InfoRow label="Tagline" value={APP.TAGLINE} />
            <InfoRow label="Description" value={APP.DESCRIPTION} />
            <InfoRow label="Version" value={APP.VERSION} />
          </CardContent>
        </Card>

        {/* Admin Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Signed-in Admin</CardTitle>
                <CardDescription>Your account details.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {user ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {getUserName(user) || '—'}
                  </span>
                  <Badge variant={user.role === 'admin' ? 'gradient' : 'secondary'} size="sm">
                    {user.role === 'admin' ? 'Admin' : 'Customer'}
                  </Badge>
                </div>
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone || '—'} />
                <InfoRow
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Email Verified"
                  value={user.isEmailVerified ? 'Yes' : 'No'}
                />
                <InfoRow label="Member Since" value={user.createdAt ? formatDate(user.createdAt) : '—'} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No signed-in user.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Preferences */}
      <div className="mt-6">
        <AdminSection
          title="Store Preferences"
          description="These toggles directly update database settings and affect storefront behavior in real-time."
        >
          <Card>
            {isLoading ? (
              <CardContent className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </CardContent>
            ) : (
              <CardContent className="divide-y divide-border p-0">
                {TOGGLES.map((t) => (
                  <div key={t.key} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <SettingsIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <Checkbox
                        label={t.label}
                        description={t.description}
                        checked={currentValues[t.key]}
                        disabled={isPending}
                        onChange={(e) => handleToggle(t.key, e.target.checked)}
                      />
                    </div>
                    <Badge variant={currentValues[t.key] ? 'success' : 'outline'} size="sm">
                      {currentValues[t.key] ? 'On' : 'Off'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </AdminSection>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="max-w-[60%] text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
