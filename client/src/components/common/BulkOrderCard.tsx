import { useState } from 'react'
import { Boxes, Sparkles, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import BulkOrderModal from './BulkOrderModal'

interface BulkOrderCardProps {
  className?: string
  variant?: 'card' | 'banner'
}

export default function BulkOrderCard({
  className = '',
  variant = 'banner',
}: BulkOrderCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (variant === 'banner') {
    return (
      <>
        <div
          className={`relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/30 via-background to-slate-900/30 p-6 sm:p-8 backdrop-blur-sm ${className}`}
        >
          {/* Subtle accent glow */}
          <div className="absolute top-0 right-1/4 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
                <Boxes className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                    <Sparkles className="h-3 w-3" /> Volume Discount
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">• B2B & Labs</span>
                </div>
                <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground">
                  Purchasing for a College Lab, Club, or Commercial Project?
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                  Submit your required component list and quantities directly. Our administration team
                  prepares custom wholesale quotations with GST invoicing and fast fulfillment.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto shadow-md"
                leftIcon={<Send className="h-4 w-4" />}
              >
                Request Bulk Quotation
              </Button>
            </div>
          </div>
        </div>

        <BulkOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    )
  }

  return (
    <>
      <div
        className={`w-full overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm text-center space-y-4 ${className}`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Boxes className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <h4 className="text-base font-heading font-semibold text-foreground">
            Order in Bulk & Save
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Need multiple microcontrollers, sensors, or kits? Submit your requirements for a discounted manual quotation.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="w-full"
          leftIcon={<Send className="h-3.5 w-3.5" />}
        >
          Request Bulk Quotation
        </Button>

        <BulkOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </>
  )
}
