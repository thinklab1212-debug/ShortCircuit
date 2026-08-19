import { AlertTriangle, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePublicSettings, useUpdateAdminSettings } from '@/hooks'

export function AdminMaintenanceBanner() {
  const { data: settings } = usePublicSettings()
  const { mutate: updateSettings, isPending } = useUpdateAdminSettings()

  if (!settings?.isMaintenanceMode) return null

  return (
    <div className="relative z-50 flex items-center justify-between gap-4 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200 backdrop-blur-md dark:bg-amber-950/40">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
        <span>
          <strong className="font-semibold text-amber-300">MAINTENANCE MODE IS ACTIVE.</strong> Visitors and customers are currently blocked by the Maintenance screen.
        </span>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="h-7 border-amber-500/40 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 hover:text-white"
        onClick={() => updateSettings({ isMaintenanceMode: false })}
        disabled={isPending}
      >
        <Power className="mr-1.5 h-3 w-3" />
        Turn Off Maintenance Mode
      </Button>
    </div>
  )
}
