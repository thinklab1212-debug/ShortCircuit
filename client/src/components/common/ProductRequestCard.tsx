import { useState } from 'react'
import { Sparkles, Mail, Send, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProductRequestModal from './ProductRequestModal'

interface ProductRequestCardProps {
  searchTerm?: string
  className?: string
  variant?: 'card' | 'banner'
}

export default function ProductRequestCard({
  searchTerm = '',
  className = '',
  variant = 'card',
}: ProductRequestCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const directMailSubject = encodeURIComponent(
    searchTerm
      ? `Product Enquiry: ${searchTerm}`
      : 'Product Enquiry / Missing Item Request'
  )
  const directMailBody = encodeURIComponent(
    `Hi Short Circuit Team,\n\nI was looking for the following product on your store:\n- Product Name: ${
      searchTerm || ''
    }\n- Description/Specs:\n\nPlease let me know if you can add it to the catalog.\n\nThank you!`
  )
  const directMailHref = `mailto:sales.shortcircuit@gmail.com?subject=${directMailSubject}&body=${directMailBody}`

  if (variant === 'banner') {
    return (
      <>
        <div
          className={`relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-secondary/10 p-6 sm:p-8 ${className}`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Cpu className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground">
                  Didn't find your required product?
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Tell our engineering and catalog team what you need. We source genuine parts from verified
                  distributors and add them to our inventory quickly.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto"
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                Request Product
              </Button>
              <a
                href={directMailHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors w-full sm:w-auto text-center"
              >
                <Mail className="h-4 w-4" />
                Email Admin
              </a>
            </div>
          </div>
        </div>

        <ProductRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialProductName={searchTerm}
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
          <Sparkles className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <h4 className="text-base sm:text-lg font-heading font-semibold text-foreground">
            Looking for an unlisted component?
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {searchTerm ? (
              <>
                Couldn't find <span className="font-semibold text-foreground">"{searchTerm}"</span> in our store? Send an enquiry directly to our admin team and we'll stock it for you.
              </>
            ) : (
              'Send a quick product enquiry to our team. We stock custom ICs, microcontrollers, sensors, and robotics modules on request.'
            )}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            size="default"
            className="w-full sm:w-auto"
            leftIcon={<Send className="h-4 w-4" />}
          >
            {searchTerm ? `Request "${searchTerm.slice(0, 20)}${searchTerm.length > 20 ? '...' : ''}"` : 'Request Component'}
          </Button>

          <a
            href={directMailHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors w-full sm:w-auto"
          >
            <Mail className="h-4 w-4 text-muted-foreground" />
            Email Admin (sales.shortcircuit@gmail.com)
          </a>
        </div>
      </div>

      <ProductRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialProductName={searchTerm}
      />
    </>
  )
}
