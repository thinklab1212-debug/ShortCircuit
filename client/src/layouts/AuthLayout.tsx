import { Outlet } from 'react-router'
import { Link } from 'react-router'
import { X } from 'lucide-react'
import { APP } from '@/constants'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { ScrollToTop } from '@/components/layout/ScrollToTop'

// ─── Auth Layout (Login, Register, Forgot Password) ────────────────────────────

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <ScrollToTop />
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 h-48 w-48 rounded-full bg-slate-300/10 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-primary-foreground">
          <BrandLogo size="lg" className="mb-8" />
          <h1 className="text-4xl font-bold font-heading mb-4 text-center">{APP.NAME}</h1>
          <p className="text-lg text-primary-foreground/80 text-center max-w-md">
            {APP.DESCRIPTION}
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold">50K+</div>
              <div className="text-sm text-primary-foreground/60">Products</div>
            </div>
            <div>
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-sm text-primary-foreground/60">Customers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">99%</div>
              <div className="text-sm text-primary-foreground/60">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Area */}
      <div className="flex w-full lg:w-1/2 flex-col">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <BrandLogo size="sm" />
            <span className="text-lg font-bold font-heading">{APP.NAME}</span>
          </Link>
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ml-auto"
            aria-label="Back to store"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
