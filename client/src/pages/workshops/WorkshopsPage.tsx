import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  ArrowRight,
  Sparkles,
  Building2,
  GraduationCap,
  CheckCircle2,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { workshopApi } from '@/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { fadeInUp, staggerContainer } from '@/config/animations'
import type { WorkshopInquiryFormData } from '@/types'

// Controlled list of Workshop / Training Areas
const WORKSHOP_AREAS = [
  'Robotics',
  'Drone Technology',
  'IoT',
  'Embedded Systems',
  'Arduino / Electronics',
  'Electrical Engineering',
  'Customized Workshop',
] as const

const INSTITUTION_TYPES = ['School', 'College', 'University', 'Other'] as const
const STUDENT_COUNTS = ['Less than 30', '30–50', '50–100', '100–200', '200+'] as const

const initialFormData: WorkshopInquiryFormData = {
  institutionName: '',
  institutionType: 'College',
  contactPerson: '',
  email: '',
  phone: '',
  workshopArea: 'Robotics',
  expectedStudents: '30–50',
  location: '',
  preferredDate: '',
  message: '',
}

export default function WorkshopsPage() {
  const inquirySectionRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState<WorkshopInquiryFormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof WorkshopInquiryFormData, string>>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Fetch active workshops
  const { data: workshopsData, isLoading: isLoadingWorkshops } = useQuery({
    queryKey: ['workshops', 'active'],
    queryFn: async () => (await workshopApi.getActive()).data.data,
  })

  // Fetch active experience (institutions)
  const { data: experienceData, isLoading: isLoadingExperience } = useQuery({
    queryKey: ['workshops', 'experience'],
    queryFn: async () => (await workshopApi.getActiveExperience()).data.data,
  })

  const workshops = workshopsData || []
  const organizations = experienceData || []

  // Smooth scroll and pre-select workshop area
  const handleInquireClick = (areaName?: string) => {
    if (areaName) {
      // Find matching controlled option or default to Customized
      const matched = WORKSHOP_AREAS.find(
        (a) => a.toLowerCase() === areaName.toLowerCase() || areaName.toLowerCase().includes(a.toLowerCase())
      )
      setFormData((prev) => ({
        ...prev,
        workshopArea: matched || areaName,
      }))
    }
    inquirySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof WorkshopInquiryFormData, string>> = {}
    if (!formData.institutionName.trim()) {
      errors.institutionName = 'Institution name is required'
    }
    if (!formData.contactPerson.trim()) {
      errors.contactPerson = 'Contact person name is required'
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address'
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (formData.phone.trim().length < 7) {
      errors.phone = 'Please enter a valid phone number'
    }
    if (!formData.location.trim()) {
      errors.location = 'Location / City is required'
    }
    if (!formData.workshopArea) {
      errors.workshopArea = 'Please select a workshop area'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Mutation for submitting inquiry
  const inquiryMutation = useMutation({
    mutationFn: (payload: WorkshopInquiryFormData) => workshopApi.submitInquiry(payload),
    onSuccess: () => {
      setIsSubmitted(true)
      setFormErrors({})
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    inquiryMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* ─── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/40 py-16 sm:py-24 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
        
        <div className="container relative mx-auto px-4 max-w-6xl text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Institutional Programs & Training
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground font-heading max-w-4xl mx-auto leading-tight"
          >
            Practical Workshops & Training for{' '}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Schools & Colleges
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            ShortCircuit organizes customized technical workshops and training programs designed to impart practical skills in modern technology domains.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <Button
              size="lg"
              onClick={() => handleInquireClick()}
              className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold"
            >
              Organize a Workshop
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const el = document.getElementById('offerings-section')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              View Training Programs
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── SECTION 1: Training & Workshops (What We Offer) ───────────────────── */}
      <section id="offerings-section" className="py-16 sm:py-24 container mx-auto px-4 max-w-6xl space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 text-xs">
            What We Offer
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-heading">
            Training & Workshops
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Explore the specialized technical training domains ShortCircuit provides for campuses and student groups.
          </p>
        </div>

        {isLoadingWorkshops ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-card border border-border animate-pulse p-6 space-y-4" />
            ))}
          </div>
        ) : workshops.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {workshops.map((workshop, idx) => (
              <motion.div
                key={workshop._id}
                variants={fadeInUp}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card/60 p-7 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="space-y-4">
                  {/* Top bar: Category badge + Index number */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {workshop.category}
                    </span>
                    <span className="font-mono text-sm font-semibold text-muted-foreground/60 group-hover:text-primary transition-colors">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors font-heading pt-1">
                    {workshop.title}
                  </h3>

                  {/* Short Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">
                    {workshop.description}
                  </p>
                </div>

                {/* Contextual CTA: Inquire About Workshop */}
                <div className="pt-6 border-t border-border/50 mt-6">
                  <button
                    onClick={() => handleInquireClick(workshop.title)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group-hover:translate-x-1 duration-200"
                  >
                    <span>Inquire About Workshop</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center max-w-lg mx-auto space-y-3 bg-muted/20">
            <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-foreground text-lg">Workshops In Preparation</h3>
            <p className="text-sm text-muted-foreground">
              We customize technical programs for schools and colleges. Reach out below to organize a tailored workshop for your institution.
            </p>
            <Button variant="outline" size="sm" onClick={() => handleInquireClick()}>
              Request Customized Program
            </Button>
          </div>
        )}
      </section>

      {/* ─── SECTION 2: Our Experience (Institutions We've Worked With) ────────── */}
      <section className="py-16 sm:py-20 border-y border-border/60 bg-muted/20">
        <div className="container mx-auto px-4 max-w-6xl space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 text-xs">
              Our Experience
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
              Institutions We&apos;ve Worked With
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              ShortCircuit has organized practical workshops and technical programs across educational institutions.
            </p>
          </div>

          {isLoadingExperience ? (
            <div className="flex flex-wrap justify-center items-center gap-6 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-44 rounded-xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          ) : organizations.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 items-center">
              {organizations.map((org) => (
                <div
                  key={org._id}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-md transition-all text-center h-28 space-y-2"
                >
                  <div className="h-12 w-full flex items-center justify-center">
                    <img
                      src={org.logo.url}
                      alt={org.name}
                      className="max-h-12 max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-85 group-hover:opacity-100"
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground line-clamp-1 transition-colors">
                    {org.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm max-w-md mx-auto space-y-2">
              <Building2 className="h-8 w-8 mx-auto text-muted-foreground/60" />
              <p>
                Partner with ShortCircuit to bring practical technical workshops to your campus.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 3: Organize a Workshop (Primary Conversion) ───────────────── */}
      <section
        ref={inquirySectionRef}
        id="organize-workshop"
        className="py-16 sm:py-24 container mx-auto px-4 max-w-5xl"
      >
        <div className="relative rounded-3xl border border-primary/20 bg-card p-6 sm:p-10 lg:p-12 shadow-2xl shadow-primary/5 overflow-hidden">
          {/* Subtle decorative background accent */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="relative text-center max-w-2xl mx-auto space-y-3 mb-10">
            <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1 text-xs">
              Organize a Workshop
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-heading">
              Let&apos;s Build Something Together
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Interested in organizing a workshop or training program for your students? Tell us what you are looking for and our team will get in touch.
            </p>
          </div>

          {/* Success State */}
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-primary/30 bg-primary/5 p-8 sm:p-12 text-center space-y-5 max-w-lg mx-auto my-8"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-heading text-foreground">Inquiry Received</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Thank you for your inquiry. Our team will review your requirements and contact you shortly.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSubmitted(false)
                  setFormData(initialFormData)
                }}
              >
                Submit Another Inquiry
              </Button>
            </motion.div>
          ) : (
            /* Inquiry Form */
            <form onSubmit={handleSubmit} className="relative space-y-8">
              {/* Part 1: Institution Details */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Institution Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Institution Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="e.g. ABC College of Engineering"
                      value={formData.institutionName}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, institutionName: e.target.value }))
                        if (formErrors.institutionName) setFormErrors((p) => ({ ...p, institutionName: undefined }))
                      }}
                      className={formErrors.institutionName ? 'border-destructive' : ''}
                    />
                    {formErrors.institutionName && (
                      <p className="text-xs text-destructive mt-1">{formErrors.institutionName}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Institution Type <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.institutionType}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          institutionType: e.target.value as WorkshopInquiryFormData['institutionType'],
                        }))
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                    >
                      {INSTITUTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Contact Person Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Dr. John Doe / Prof. Smith"
                      value={formData.contactPerson}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, contactPerson: e.target.value }))
                        if (formErrors.contactPerson) setFormErrors((p) => ({ ...p, contactPerson: undefined }))
                      }}
                      className={formErrors.contactPerson ? 'border-destructive' : ''}
                    />
                    {formErrors.contactPerson && (
                      <p className="text-xs text-destructive mt-1">{formErrors.contactPerson}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Email Address <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="contact@institution.edu"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, email: e.target.value }))
                        if (formErrors.email) setFormErrors((p) => ({ ...p, email: undefined }))
                      }}
                      className={formErrors.email ? 'border-destructive' : ''}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-destructive mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Phone Number <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, phone: e.target.value }))
                        if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: undefined }))
                      }}
                      className={formErrors.phone ? 'border-destructive' : ''}
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-destructive mt-1">{formErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Part 2: Workshop Requirements */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Workshop Requirements
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Workshop / Training Area <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.workshopArea}
                      onChange={(e) => setFormData((p) => ({ ...p, workshopArea: e.target.value }))}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground font-medium"
                    >
                      {WORKSHOP_AREAS.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-muted-foreground mt-1 block">
                      You can select an area or choose Customized Workshop.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Expected Number of Students <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.expectedStudents}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          expectedStudents: e.target.value as WorkshopInquiryFormData['expectedStudents'],
                        }))
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground"
                    >
                      {STUDENT_COUNTS.map((count) => (
                        <option key={count} value={count}>
                          {count}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Location / City <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Bengaluru, Karnataka"
                      value={formData.location}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, location: e.target.value }))
                        if (formErrors.location) setFormErrors((p) => ({ ...p, location: undefined }))
                      }}
                      className={formErrors.location ? 'border-destructive' : ''}
                    />
                    {formErrors.location && (
                      <p className="text-xs text-destructive mt-1">{formErrors.location}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      Preferred Date <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.preferredDate || ''}
                      onChange={(e) => setFormData((p) => ({ ...p, preferredDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">
                    Additional Requirements / Message <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Textarea
                    placeholder="Tell us about specific topics, lab setup, or schedule preferences..."
                    rows={4}
                    value={formData.message || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  />
                </div>
              </div>

              {/* Error Banner if mutation fails */}
              {inquiryMutation.isError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Failed to submit inquiry. Please check your information and try again.</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2 text-center">
                <Button
                  type="submit"
                  size="lg"
                  disabled={inquiryMutation.isPending}
                  className="w-full sm:w-auto min-w-[240px] font-semibold gap-2 shadow-lg shadow-primary/25"
                >
                  {inquiryMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Inquiry
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Our team reviews inquiries and reaches out directly to finalize curriculum and coordination.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
