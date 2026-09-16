import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Plus, Trash2, Boxes, CheckCircle2, Building2, Phone, Mail, User, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { useAuthStore } from '@/store'
import { bulkOrderApi } from '@/services'
import type { BulkOrderFormData, BulkOrderItem } from '@/types'

interface BulkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  initialProduct?: string
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 20,
    transition: { duration: 0.15 },
  },
}

export default function BulkOrderModal({
  isOpen,
  onClose,
  initialProduct = '',
}: BulkOrderModalProps) {
  const { user } = useAuthStore()

  const [form, setForm] = useState<BulkOrderFormData>({
    name: '',
    email: '',
    phone: '',
    organization: '',
    city: '',
    pincode: '',
    items: [{ productName: '', quantity: 10, targetPrice: undefined, notes: '' }],
    notes: '',
  })

  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    phone?: string
    items?: string
  }>({})

  const [loading, setLoading] = useState(false)
  const [successQuoteNumber, setSuccessQuoteNumber] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Reset / pre-fill whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSuccessQuoteNumber(null)
      setForm({
        name: user ? `${user.firstName} ${user.lastName}`.trim() : '',
        email: user?.email || '',
        phone: user?.phone || '',
        organization: '',
        city: '',
        pincode: '',
        items: [
          {
            productName: initialProduct || '',
            quantity: 10,
            targetPrice: undefined,
            notes: '',
          },
        ],
        notes: '',
      })
      setErrors({})
    }
  }, [isOpen, user, initialProduct])

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Scroll lock
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

  // Item list handlers
  const handleAddItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { productName: '', quantity: 10, targetPrice: undefined, notes: '' },
      ],
    }))
  }

  const handleRemoveItem = (index: number) => {
    if (form.items.length <= 1) return
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleItemChange = (
    index: number,
    field: keyof BulkOrderItem,
    value: any
  ) => {
    setForm((prev) => {
      const updated = [...prev.items]
      updated[index] = {
        ...updated[index],
        [field]: value,
      }
      return { ...prev, items: updated }
    })
  }

  // Validate form
  const validate = () => {
    const errs: {
      name?: string
      email?: string
      phone?: string
      items?: string
    } = {}

    if (!form.name.trim()) errs.name = 'Full name is required'
    if (!form.email.trim()) {
      errs.email = 'Email address is required'
    } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errs.email = 'Enter a valid email address'
    }

    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required'
    } else if (form.phone.trim().length < 7) {
      errs.phone = 'Phone number must be at least 7 characters'
    }

    if (!form.items.length) {
      errs.items = 'Please add at least one product'
    } else {
      const hasEmptyProduct = form.items.some((it) => !it.productName.trim())
      if (hasEmptyProduct) {
        errs.items = 'Please enter product name/description for all items'
      }
      const hasInvalidQty = form.items.some((it) => !it.quantity || it.quantity <= 0)
      if (hasInvalidQty) {
        errs.items = 'Quantities must be at least 1 for all items'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      // Clean data
      const payload: BulkOrderFormData = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        organization: form.organization?.trim() || undefined,
        city: form.city?.trim() || undefined,
        pincode: form.pincode?.trim() || undefined,
        items: form.items.map((it) => ({
          productName: it.productName.trim(),
          quantity: Number(it.quantity) || 1,
          targetPrice: it.targetPrice ? Number(it.targetPrice) : undefined,
          notes: it.notes?.trim() || undefined,
        })),
        notes: form.notes?.trim() || undefined,
      }

      const res = await bulkOrderApi.submitQuoteRequest(payload)
      const quoteNum = res.data?.data?.quoteNumber || 'SC-RFQ-CONFIRMED'
      setSuccessQuoteNumber(quoteNum)
      toast.success('Quotation request submitted successfully!')
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to submit quote request. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Box */}
          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl z-10 overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground">
                    Request Bulk Order Quotation
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Volume pricing for institutions, colleges, labs & robotics teams
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {successQuoteNumber ? (
                /* Success State */
                <div className="py-6 text-center space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xl font-heading font-bold text-foreground">
                      Quotation Request Received!
                    </h4>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Thank you for submitting your bulk requirements. Our sales & engineering administration
                      team is reviewing your parts list.
                    </p>
                  </div>

                  <div className="inline-block rounded-xl border border-border bg-muted/50 px-5 py-3 text-center">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block">
                      Quotation Reference ID
                    </span>
                    <span className="text-lg font-mono font-bold text-primary block mt-0.5">
                      {successQuoteNumber}
                    </span>
                  </div>

                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs sm:text-sm text-muted-foreground text-left max-w-md mx-auto space-y-2">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-primary" /> What happens next?
                    </p>
                    <p>
                      Our admin will prepare a customized quotation with discounted bulk pricing,
                      estimated shipping times, and GST tax invoice details, and email it directly to{' '}
                      <span className="font-medium text-foreground">{form.email}</span>.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button onClick={onClose} className="px-8">
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                /* Form State */
                <form id="bulk-order-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Contact Details */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> 1. Contact Information
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <FormField label="Full Name" required error={errors.name}>
                        <Input
                          placeholder="e.g. Dr. Aryan Sharma / Team Lead"
                          value={form.name}
                          onChange={(e) => {
                            setForm({ ...form, name: e.target.value })
                            if (errors.name) setErrors({ ...errors, name: undefined })
                          }}
                        />
                      </FormField>

                      <FormField label="Email Address" required error={errors.email}>
                        <Input
                          type="email"
                          placeholder="name@college.edu / name@company.com"
                          value={form.email}
                          onChange={(e) => {
                            setForm({ ...form, email: e.target.value })
                            if (errors.email) setErrors({ ...errors, email: undefined })
                          }}
                        />
                      </FormField>

                      <FormField label="Phone Number" required error={errors.phone}>
                        <div className="relative">
                          <Input
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={form.phone}
                            onChange={(e) => {
                              setForm({ ...form, phone: e.target.value })
                              if (errors.phone) setErrors({ ...errors, phone: undefined })
                            }}
                          />
                        </div>
                      </FormField>

                      <FormField label="Organization / College / Lab" optional>
                        <Input
                          placeholder="e.g. IIT Delhi Robotics Club / XYZ Tech"
                          value={form.organization || ''}
                          onChange={(e) => setForm({ ...form, organization: e.target.value })}
                        />
                      </FormField>

                      <FormField label="Delivery City" optional>
                        <Input
                          placeholder="e.g. Bengaluru, Pune, Delhi"
                          value={form.city || ''}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                        />
                      </FormField>

                      <FormField label="Pincode" optional>
                        <Input
                          placeholder="e.g. 560001"
                          maxLength={10}
                          value={form.pincode || ''}
                          onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Required Products List */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Boxes className="h-3.5 w-3.5" /> 2. Required Products & Quantities
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {form.items.length} {form.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {errors.items && (
                      <p className="text-xs text-error-500 font-medium bg-error-500/10 px-3 py-1.5 rounded-lg">
                        {errors.items}
                      </p>
                    )}

                    <div className="space-y-3">
                      {form.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-border bg-card/50 space-y-3 relative group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">
                              Item #{idx + 1}
                            </span>
                            {form.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-muted-foreground hover:text-error-500 p-1 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-7">
                              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                Product Name / Part # / Description *
                              </label>
                              <Input
                                placeholder="e.g. ESP32-WROOM-32D Development Board"
                                value={item.productName}
                                onChange={(e) =>
                                  handleItemChange(idx, 'productName', e.target.value)
                                }
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                Quantity *
                              </label>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(idx, 'quantity', parseInt(e.target.value) || '')
                                }
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                Target Price (₹/unit)
                              </label>
                              <Input
                                type="number"
                                min={0}
                                placeholder="Optional"
                                value={item.targetPrice !== undefined ? item.targetPrice : ''}
                                onChange={(e) =>
                                  handleItemChange(
                                    idx,
                                    'targetPrice',
                                    e.target.value === '' ? undefined : Number(e.target.value)
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <Input
                              placeholder="Specifications / Package notes (e.g. 5V version, with headers soldered)"
                              className="text-xs h-8"
                              value={item.notes || ''}
                              onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddItem}
                        className="w-full border-dashed"
                        leftIcon={<Plus className="h-3.5 w-3.5" />}
                      >
                        Add Another Product
                      </Button>
                    </div>
                  </div>

                  {/* General Notes */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      3. Additional Requirements / Timeline
                    </h4>
                    <Textarea
                      placeholder="Please mention any delivery deadline, GST requirements, preferred courier, or specific project details..."
                      rows={3}
                      value={form.notes || ''}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            {!successQuoteNumber && (
              <div className="border-t border-border px-5 py-4 bg-muted/20 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                  Quotes are prepared manually by admin and sent via email.
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 sm:flex-initial"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="bulk-order-form"
                    isLoading={loading}
                    leftIcon={<Send className="h-4 w-4" />}
                    className="flex-1 sm:flex-initial"
                  >
                    Submit Quotation Request
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
