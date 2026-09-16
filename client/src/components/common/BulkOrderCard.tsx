import { useState } from 'react'
import { Boxes, Send } from 'lucide-react'
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
          className={`relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-secondary/10 p-6 sm:p-8 ${className}`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Boxes className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground">
                  Purchasing for a College Lab, Club, or Commercial Project?
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Submit your required component list and quantities directly. Our administration team
                  prepares custom wholesale quotations with GST invoicing and fast fulfillment.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto"
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
        className={`w-full max-w-xl mx-auto overflow-hidden rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm text-center space-y-4 ${className}`}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Boxes className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <h4 className="text-base sm:text-lg font-heading font-semibold text-foreground">
            Order in Bulk & Save
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Purchasing multiple components or lab kits? Submit your requirements for a discounted manual wholesale quotation.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center">
          <Button
            onClick={() => setIsModalOpen(true)}
            size="default"
            className="w-full sm:w-auto"
            leftIcon={<Send className="h-4 w-4" />}
          >
            Request Bulk Quotation
          </Button>
        </div>

        <BulkOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </>
  )
}
