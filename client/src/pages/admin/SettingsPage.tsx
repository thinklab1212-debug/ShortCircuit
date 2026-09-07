import { useState, useEffect } from 'react'
import {
  Store,
  User as UserIcon,
  ShieldCheck,
  Mail,
  Phone,
  Settings as SettingsIcon,
  Loader2,
  QrCode,
  Save,
  Sparkles,
  Info,
} from 'lucide-react'
import { AdminPageHeader, AdminSection } from '@/components/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { APP } from '@/constants'
import { getUserName, formatDate } from '@/utils'
import { useAuthStore } from '@/store'
import { useAdminSettings, useUpdateAdminSettings } from '@/hooks'
import toast from 'react-hot-toast'

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

  const [upiId, setUpiId] = useState('')
  const [upiName, setUpiName] = useState('ShortCircuit')
  const [upiBankName, setUpiBankName] = useState('')

  useEffect(() => {
    if (settings) {
      setUpiId(settings.eventUpiId || '')
      setUpiName(settings.eventUpiName || 'ShortCircuit')
      setUpiBankName(settings.eventUpiBankName || '')
    }
  }, [settings])

  const currentValues = {
    isMaintenanceMode: settings?.isMaintenanceMode ?? false,
    codEnabled: settings?.codEnabled ?? true,
    guestCheckoutEnabled: settings?.guestCheckoutEnabled ?? false,
    emailNotificationsEnabled: settings?.emailNotificationsEnabled ?? true,
  }

  const handleToggle = (key: keyof typeof currentValues, checked: boolean) => {
    updateSettings({ [key]: checked })
  }

  const handleSaveUpi = (e: React.FormEvent) => {
    e.preventDefault()
    updateSettings(
      {
        eventUpiId: upiId.trim(),
        eventUpiName: upiName.trim() || 'ShortCircuit',
        eventUpiBankName: upiBankName.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Event UPI settings updated successfully!')
        },
        onError: () => {
          toast.error('Failed to update UPI settings.')
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Settings" description="Store information, payment preferences, and live system controls." />

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

      {/* Event Orders UPI Payment Settings */}
      <AdminSection
        title="Event Orders — Direct UPI Payment Settings"
        description="Configure the receiver UPI ID and branding for event kit QR code checkouts. Changes take effect instantly for all students without restarting the server."
      >
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border/70 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Direct UPI Payment Gateway</CardTitle>
                  <CardDescription className="text-xs">
                    Receive 100% of event kit payments directly to your bank account with zero gateway commissions.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="success" size="sm" className="hidden sm:inline-flex gap-1 items-center">
                <Sparkles className="h-3 w-3" />
                Live Control
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveUpi} className="space-y-4 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <span>Receiver UPI ID (VPA)</span>
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. yourname@okaxis, 9876543210@paytm, merchant@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  The UPI address where students' event kit payments will be directly credited.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Payee Display Name
                  </label>
                  <Input
                    type="text"
                    placeholder="ShortCircuit"
                    value={upiName}
                    onChange={(e) => setUpiName(e.target.value)}
                    className="text-sm font-medium"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Displayed prominently on student checkout & UPI apps.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Registered Bank Account Name (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Official Name on Bank Account"
                    value={upiBankName}
                    onChange={(e) => setUpiBankName(e.target.value)}
                    className="text-sm font-medium"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Shown as reassurance subtitle on checkout for transparency.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  When you save, the dynamic QR code on the Event Checkout page updates immediately. Any fallback in <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">.env</code> will be automatically overridden by these database settings.
                </span>
              </div>

              <div className="pt-2">
                <Button type="submit" size="sm" loading={isPending} className="text-xs gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  Save UPI Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </AdminSection>

      {/* Live Preferences */}
      <div>
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
