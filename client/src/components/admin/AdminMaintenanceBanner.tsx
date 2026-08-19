import { AlertTriangle, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePublicSettings, useUpdateAdminSettings } from '@/hooks'

export function AdminMaintenanceBanner() {
  const { data: settings } = usePublicSettings()
  const { mutate: updateSettings, isPending } = useUpdateAdminSettings()

  if (!settings?.isMaintenanceMode) return null

  return (
    <div className="relative z-50 flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-xs text-amber-950 dark:bg-amber-950/80 dark:text-amber-100 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/25 text-amber-700 dark:bg-amber-500/30 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
        <span className="leading-tight">
          <strong className="font-bold text-amber-900 dark:text-amber-300">MAINTENANCE MODE IS ACTIVE.</strong>{' '}
          <span className="font-medium text-amber-800 dark:text-amber-200">Visitors and customers are currently blocked by the Maintenance screen.</span>
        </span>
      </div>

      <Button
        size="sm"
        className="h-7 border-0 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-semibold shadow-sm text-xs px-3"
        onClick={() => updateSettings({ isMaintenanceMode: false })}
        disabled={isPending}
      >
        <Power className="mr-1.5 h-3.5 w-3.5" />
        Turn Off Maintenance Mode
      </Button>
    </div>
  )
}
