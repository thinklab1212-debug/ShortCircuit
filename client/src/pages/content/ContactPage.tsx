import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { staggerContainer, fadeInUp } from '@/config/animations'
import { contactApi } from '@/services'

interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
}

const EMPTY: ContactForm = { name: '', email: '', subject: '', message: '' }

const DETAILS = [
  { icon: Mail, label: 'Email us', value: 'sales.shortcircuit@gmail.com', href: 'mailto:sales.shortcircuit@gmail.com' },
  { icon: Phone, label: 'Call us (Primary)', value: '+91 93354 06525', href: 'tel:+919335406525' },
  { icon: Phone, label: 'Call us (Secondary)', value: '+91 92199 98403', href: 'tel:+919219998403' },
  {
    icon: MapPin,
    label: 'Visit us',
    value: 'B-Block, New Ashok Nagar, New Delhi, Pin - 110096',
  },
]

const HOURS = [
  { day: 'Monday – Friday', time: '9:00 AM – 8:00 PM' },
  { day: 'Saturday', time: '10:00 AM – 6:00 PM' },
  { day: 'Sunday', time: 'Closed' },
]

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({})
  const [loading, setLoading] = useState(false)

  const update = (key: keyof ContactForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const next: Partial<Record<keyof ContactForm, string>> = {}
    if (!form.name.trim()) next.name = 'Please enter your name'
    if (!form.email.trim()) next.email = 'Please enter your email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address'
    if (!form.subject.trim()) next.subject = 'Please add a subject'
    if (!form.message.trim()) next.message = 'Please write a message'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await contactApi.sendMessage(form)
      toast.success(res.data.message || "Thanks! We'll get back to you within 24 hours.")
      setForm(EMPTY)
      setErrors({})
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send message. Please try again later.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-6 lg:py-8">
      <Breadcrumb items={[{ label: 'Contact' }]} className="mb-6" />

      {/* Intro */}
      <div className="mb-10 max-w-2xl">
        <h1 className="text-display-xs font-heading text-foreground sm:text-display-sm">Get in touch</h1>
        <p className="mt-3 text-body-md leading-relaxed text-muted-foreground">
          Have a question about an order, a product spec, or a bulk enquiry for your lab or
          college? Our support team is here to help. Send us a message and we'll respond
          within one business day.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <motion.form
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 lg:col-span-3 lg:p-8"
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Name" htmlFor="name" required error={errors.name}>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Your full name"
                error={!!errors.name}
              />
            </FormField>
            <FormField label="Email" htmlFor="email" required error={errors.email}>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                error={!!errors.email}
              />
            </FormField>
          </div>

          <FormField label="Subject" htmlFor="subject" required error={errors.subject} className="mt-5">
            <Input
              id="subject"
              value={form.subject}
              onChange={(e) => update('subject', e.target.value)}
              placeholder="How can we help?"
              error={!!errors.subject}
            />
          </FormField>

          <FormField label="Message" htmlFor="message" required error={errors.message} className="mt-5">
            <Textarea
              id="message"
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
              placeholder="Tell us a bit more..."
              rows={5}
              error={!!errors.message}
            />
          </FormField>

          <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto" loading={loading} rightIcon={<Send className="h-4 w-4" />}>
            Send message
          </Button>
        </motion.form>

        {/* Details */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-4 lg:col-span-2"
        >
          {DETAILS.map((d) => {
            const Icon = d.icon
            const content = (
              <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{d.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{d.value}</p>
                </div>
              </div>
            )
            return (
              <motion.div key={d.label} variants={fadeInUp}>
                {d.href ? (
                  <a href={d.href} className="block">
                    {content}
                  </a>
                ) : (
                  content
                )}
              </motion.div>
            )
          })}

          <motion.div variants={fadeInUp} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">Business hours</p>
            </div>
            <dl className="mt-4 space-y-2">
              {HOURS.map((h) => (
                <div key={h.day} className="flex items-center justify-between text-sm">
                  <dt className="text-muted-foreground">{h.day}</dt>
                  <dd className="font-medium text-foreground">{h.time}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
