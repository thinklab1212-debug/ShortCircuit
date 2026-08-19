import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, Mail, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { useAuthStore } from '@/store'
import { contactApi } from '@/services'
import type { ProductRequestFormData } from '@/types'

interface ProductRequestModalProps {
  isOpen: boolean
  onClose: () => void
  initialProductName?: string
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15 },
  },
}

export default function ProductRequestModal({
  isOpen,
  onClose,
  initialProductName = '',
}: ProductRequestModalProps) {
  const { user } = useAuthStore()

  const [form, setForm] = useState<ProductRequestFormData>({
    name: '',
    email: '',
    productName: '',
    quantity: '',
    targetPrice: '',
    referenceUrl: '',
    specifications: '',
    notes: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ProductRequestFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)

  // Pre-fill user details & initial product name whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false)
      setForm({
        name: user ? `${user.firstName} ${user.lastName}`.trim() : '',
        email: user?.email || '',
        productName: initialProductName,
        quantity: '',
        targetPrice: '',
        referenceUrl: '',
        specifications: '',
        notes: '',
      })
      setErrors({})
    }
  }, [isOpen, user, initialProductName])

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const update = (key: keyof ProductRequestFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const next: Partial<Record<keyof ProductRequestFormData, string>> = {}
    if (!form.name.trim()) next.name = 'Please enter your name'
    if (!form.email.trim()) next.email = 'Please enter your email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email address'
    }
    if (!form.productName.trim()) next.productName = 'Please enter the product or component name'
    if (form.referenceUrl && form.referenceUrl.trim() && !/^https?:\/\//i.test(form.referenceUrl.trim())) {
      next.referenceUrl = 'Please provide a valid URL starting with http:// or https://'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await contactApi.sendProductRequest(form)
      setIsSuccess(true)
      toast.success('Product request sent to our catalog team!')
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit product inquiry. Please try again later.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            key="product-req-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Panel */}
          <motion.div
            key="product-req-modal"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-req-modal-title"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 w-full max-w-xl rounded-2xl border border-border/80 bg-background shadow-2xl overflow-hidden my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="product-req-modal-title" className="text-lg font-heading font-semibold text-foreground">
                    Request a Product / Component
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Can't find a part in our catalog? Let admin know to add it.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {isSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-950/50 dark:text-success-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-heading font-bold text-foreground">
                      Request Received!
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Thank you! Our inventory and engineering team has received your enquiry for{' '}
                      <span className="font-semibold text-foreground">"{form.productName}"</span>. We will review
                      availability and notify you at <span className="font-medium text-foreground">{form.email}</span>.
                    </p>
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
                      Close
                    </Button>
                    <a
                      href={`mailto:sales.shortcircuit@gmail.com?subject=${encodeURIComponent(
                        `Follow-up: Product Request for ${form.productName}`
                      )}`}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto"
                    >
                      <Mail className="h-4 w-4" />
                      Email Admin Directly
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* Name & Email */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Your Name" htmlFor="req-name" required error={errors.name}>
                      <Input
                        id="req-name"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        placeholder="e.g. John Doe"
                        error={!!errors.name}
                      />
                    </FormField>
                    <FormField label="Email Address" htmlFor="req-email" required error={errors.email}>
                      <Input
                        id="req-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        placeholder="you@example.com"
                        error={!!errors.email}
                      />
                    </FormField>
                  </div>

                  {/* Product Name */}
                  <FormField
                    label="Product / Component Name"
                    htmlFor="req-productName"
                    required
                    error={errors.productName}
                    hint="Part number, IC name, module name, or development board model."
                  >
                    <Input
                      id="req-productName"
                      value={form.productName}
                      onChange={(e) => update('productName', e.target.value)}
                      placeholder="e.g. Raspberry Pi 5 8GB, STM32F401 BlackPill, MPU6050..."
                      error={!!errors.productName}
                    />
                  </FormField>

                  {/* Quantity & Budget */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Quantity Needed (Optional)"
                      htmlFor="req-quantity"
                      hint="Estimated units required"
                    >
                      <Input
                        id="req-quantity"
                        value={form.quantity || ''}
                        onChange={(e) => update('quantity', e.target.value)}
                        placeholder="e.g. 5 pcs, 1 kit"
                      />
                    </FormField>
                    <FormField
                      label="Target Price / Budget (Optional)"
                      htmlFor="req-targetPrice"
                      hint="In INR (₹)"
                    >
                      <Input
                        id="req-targetPrice"
                        value={form.targetPrice || ''}
                        onChange={(e) => update('targetPrice', e.target.value)}
                        placeholder="e.g. 450"
                      />
                    </FormField>
                  </div>

                  {/* Datasheet / Reference URL */}
                  <FormField
                    label="Reference / Datasheet Link (Optional)"
                    htmlFor="req-referenceUrl"
                    error={errors.referenceUrl}
                    hint="Link to official datasheet, manufacturer page, or product reference"
                  >
                    <Input
                      id="req-referenceUrl"
                      type="url"
                      value={form.referenceUrl || ''}
                      onChange={(e) => update('referenceUrl', e.target.value)}
                      placeholder="https://..."
                      error={!!errors.referenceUrl}
                    />
                  </FormField>

                  {/* Specifications & Notes */}
                  <FormField
                    label="Specifications / Use-case Notes (Optional)"
                    htmlFor="req-notes"
                    hint="Specific voltage ratings, package types (SMD/DIP), or college project details"
                  >
                    <Textarea
                      id="req-notes"
                      rows={3}
                      value={form.notes || ''}
                      onChange={(e) => update('notes', e.target.value)}
                      placeholder="Tell us any specific requirements or timelines..."
                    />
                  </FormField>

                  {/* Submit & direct action */}
                  <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-border/60">
                    <a
                      href={`mailto:sales.shortcircuit@gmail.com?subject=${encodeURIComponent(
                        `Product Request: ${form.productName || 'New Component'}`
                      )}&body=${encodeURIComponent(
                        `Hi Short Circuit Team,\n\nI am looking for the following product:\n- Product Name: ${form.productName}\n- Quantity: ${form.quantity || 'N/A'}\n- Notes: ${form.notes || 'N/A'}\n\nThanks,\n${form.name}`
                      )}`}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Or mail sales.shortcircuit@gmail.com directly
                    </a>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 sm:flex-initial"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        loading={loading}
                        rightIcon={<Send className="h-4 w-4" />}
                        className="flex-1 sm:flex-initial"
                      >
                        Submit Request
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
