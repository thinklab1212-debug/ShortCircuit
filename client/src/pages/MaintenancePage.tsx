import { Wrench, RefreshCw, Mail, ShieldCheck, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP } from '@/constants'
import { usePublicSettings } from '@/hooks'

export default function MaintenancePage() {
  const { data: settings, isFetching, refetch } = usePublicSettings()

  const title = settings?.maintenanceTitle || 'Store Under Maintenance'
  const message =
    settings?.maintenanceMessage ||
    'We are currently performing scheduled platform enhancements. Storefront access will resume shortly.'
  const eta = settings?.maintenanceETA

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100 dark">
      {/* Background Decorative Gradients */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Animated Icon Container */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-900/80 p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          <div className="relative flex h-full w-full items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/30 opacity-75" />
            <Wrench className="relative h-10 w-10 text-primary" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary ring-1 ring-primary/20">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Scheduled Maintenance Mode
        </div>

        {/* Main Heading & Message */}
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mb-8 text-base leading-relaxed text-slate-400 sm:text-lg">
          {message}
        </p>

        {/* ETA Section if present */}
        {eta && (
          <div className="mx-auto mb-8 flex max-w-sm items-center justify-center gap-3 rounded-2xl bg-slate-900/60 px-5 py-3 text-sm text-slate-300 ring-1 ring-white/10 backdrop-blur-md">
            <Clock className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Estimated Back Online: <strong className="text-white">{eta}</strong></span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="w-full gap-2 rounded-xl sm:w-auto"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Checking Status...' : 'Check Status Again'}
          </Button>

          <a
            href={`mailto:${APP.SUPPORT_EMAIL || 'support@electrokart.com'}`}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 ring-1 ring-white/10 sm:w-auto"
          >
            <Mail className="h-4 w-4 text-slate-400" />
            Contact Support
          </a>
        </div>

        {/* Footer brand branding */}
        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-slate-600" />
          <span>{APP.NAME} System Operations & Security</span>
        </div>
      </div>
    </div>
  )
}
