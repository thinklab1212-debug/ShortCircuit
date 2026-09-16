import { useState } from 'react'
import { Boxes, Sparkles, Send, FileSpreadsheet, CheckCircle2 } from 'lucide-react'
import BulkOrderModal from './BulkOrderModal'

interface BulkOrderCardProps {
  className?: string
  variant?: 'card' | 'banner'
  initialOpenMode?: 'form' | 'upload'
}

export default function BulkOrderCard({
  className = '',
  variant = 'banner',
}: BulkOrderCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalInitialMode, setModalInitialMode] = useState<'form' | 'upload'>('form')

  const openWithMode = (mode: 'form' | 'upload') => {
    setModalInitialMode(mode)
    setIsModalOpen(true)
  }

  if (variant === 'banner') {
    return (
      <>
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 border-2 border-blue-500/30 p-6 sm:p-8 shadow-2xl text-white ${className}`}
        >
          {/* Ambient lighting glows */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left Content Area */}
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/30 ring-4 ring-blue-500/20">
                <Boxes className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/25 px-3 py-0.5 text-xs font-semibold text-blue-300 border border-blue-400/40 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" /> Bulk & Institutional Orders
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" /> GST Invoicing Available
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight">
                  Purchasing for a College Lab, Club, or Commercial Project?
                </h3>

                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Get custom discounted wholesale pricing for engineering components. Upload your Excel BOM list or enter items directly for a fast manual quotation from our sales team.
                </p>

                {/* Feature highlight pills */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300 font-medium">
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                    Excel (.xlsx / .csv) Upload
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                    <span className="text-blue-400 font-bold">✓</span>
                    Volume Tier Discounts
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                    <span className="text-blue-400 font-bold">✓</span>
                    Manual Quote via Email
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
              <button
                type="button"
                onClick={() => openWithMode('upload')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 hover:bg-white/20 border border-white/25 text-white font-semibold py-3 px-4 text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                <span>Upload Excel Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => openWithMode('form')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-5 text-sm shadow-xl shadow-blue-500/35 hover:shadow-blue-500/50 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Request Bulk Quotation</span>
              </button>
            </div>
          </div>
        </div>

        <BulkOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialMode={modalInitialMode}
        />
      </>
    )
  }

  return (
    <>
      <div
        className={`w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 border-2 border-blue-500/30 p-6 shadow-xl text-white text-center space-y-4 ${className}`}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
          <Boxes className="h-7 w-7" />
        </div>

        <div className="space-y-1.5">
          <h4 className="text-lg font-heading font-bold text-white">
            Order in Bulk & Save
          </h4>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            Need multiple microcontrollers, sensors, or kits? Upload your Excel BOM list or submit requirements for a discounted quotation.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => openWithMode('upload')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold py-2.5 px-4 text-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Upload Excel File</span>
          </button>

          <button
            type="button"
            onClick={() => openWithMode('form')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2.5 px-4 text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Request Quotation</span>
          </button>
        </div>

        <BulkOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialMode={modalInitialMode}
        />
      </div>
    </>
  )
}

