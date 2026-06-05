import { Outlet } from 'react-router'
import { Link } from 'react-router'
import { X } from 'lucide-react'
import { APP } from '@/constants'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { ScrollToTop } from '@/components/layout/ScrollToTop'

// ─── Auth Layout (Login, Register, Forgot Password) ────────────────────────────

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      <ScrollToTop />
      
      {/* Decorative blurred background circles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />
      </div>

      {/* Center Modal Card Window */}
      <div className="relative z-10 w-full max-w-[480px] rounded-2xl border border-border/60 bg-background shadow-2xl flex flex-col p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="md" />
            <span className="text-xl font-bold font-heading text-foreground">{APP.NAME}</span>
          </Link>
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Back to store"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>

        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
