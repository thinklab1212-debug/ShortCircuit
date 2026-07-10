import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  Upload,
  IndianRupee,
  ArrowLeft,
  ImagePlus,
  X,
  Pencil,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminPageHeader } from '@/components/admin'
import { useAuthStore } from '@/store'
import { useCreateEvent, useUpdateEvent, useEventDetail } from '@/hooks'
import { uploadApi } from '@/services'
import { fadeInUp, staggerContainer } from '@/config/animations'
import toast from 'react-hot-toast'

// ─── Validation Schema ──────────────────────────────────────────────────────────

const eventFormSchema = z.object({
  eventName: z
    .string()
    .min(3, 'Event name must be at least 3 characters')
    .max(200, 'Event name cannot exceed 200 characters'),
  organizationName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(200, 'Organization name cannot exceed 200 characters'),
  collegeName: z
    .string()
    .min(3, 'College name must be at least 3 characters')
    .max(200, 'College name cannot exceed 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  eventKitPrice: z
    .number()
    .min(0, 'Kit price cannot be negative'),
})

type EventFormValues = z.infer<typeof eventFormSchema>

// ─── Create / Edit Event Page ───────────────────────────────────────────────────

export default function EventFormPage() {
  const { id } = useParams()
  const isEditing = !!id
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: existingEvent, isLoading: loadingEvent } = useEventDetail(id || '')
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()

  const [banner, setBanner] = useState<{ url: string; publicId: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  // Toggle edit state for read-only fields
  const [editOrg, setEditOrg] = useState(false)
  const [editCollege, setEditCollege] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    values: isEditing && existingEvent ? {
      eventName: existingEvent.eventName,
      organizationName: existingEvent.organizationName,
      collegeName: existingEvent.collegeName,
      description: existingEvent.description,
      startDate: existingEvent.startDate?.split('T')[0] || '',
      endDate: existingEvent.endDate?.split('T')[0] || '',
      eventKitPrice: existingEvent.eventKitPrice,
    } : {
      eventName: '',
      organizationName: user?.organizerProfile?.organizationName || '',
      collegeName: user?.organizerProfile?.collegeName || '',
      description: '',
      startDate: '',
      endDate: '',
      eventKitPrice: 0,
    },
  })

  // Set banner from existing event on load
  if (isEditing && existingEvent?.banner && !banner) {
    setBanner(existingEvent.banner)
  }

  const handleBannerUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Banner must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const res = await uploadApi.image(file)
      setBanner({
        url: res.data.data.url,
        publicId: res.data.data.publicId,
      })
      toast.success('Banner uploaded!')
    } catch {
      toast.error('Failed to upload banner')
    } finally {
      setUploading(false)
    }
  }, [])

  const removeBanner = useCallback(async () => {
    if (banner?.publicId) {
      try {
        await uploadApi.remove(banner.publicId)
      } catch {
        // Silently ignore — banner may have already been removed
      }
    }
    setBanner(null)
  }, [banner])

  const onSubmit = (data: EventFormValues) => {
    const payload = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      banner: banner || undefined,
      kitProducts: isEditing && existingEvent?.kitProducts?.length
        ? existingEvent.kitProducts.map((p) => ({
            product: typeof p.product === 'string' ? p.product : (p.product as any)._id,
            productName: p.productName,
            priceAtCreation: p.priceAtCreation,
            quantity: p.quantity,
          }))
        : [], // Draft Event is allowed to exist without any kit items (Refinement 1)
    } as any

    if (isEditing) {
      updateEvent.mutate({ id: id!, data: payload })
    } else {
      createEvent.mutate(payload)
    }
  }

  if (isEditing && loadingEvent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={isEditing ? 'Edit Event' : 'Create Event'}
        description={isEditing ? 'Update your event details' : 'Set up a new event for your college or organization'}
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <motion.div variants={staggerContainer} initial="initial" animate="animate">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Event Info */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  label="Event Name"
                  htmlFor="eventName"
                  error={errors.eventName?.message}
                  required
                >
                  <Input
                    id="eventName"
                    placeholder="e.g. TechFest 2026 — Robotics Challenge"
                    error={!!errors.eventName}
                    {...register('eventName')}
                  />
                </FormField>

                {/* Organization Name (auto-fill & read-only by default) */}
                <div className="relative">
                  <FormField
                    label="Organization Name"
                    htmlFor="organizationName"
                    error={errors.organizationName?.message}
                    required
                  >
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <Input
                          id="organizationName"
                          placeholder="e.g. Robotics Club"
                          readOnly={!editOrg}
                          className={!editOrg ? 'bg-muted/50 text-muted-foreground pr-8' : ''}
                          error={!!errors.organizationName}
                          {...register('organizationName')}
                        />
                        {!editOrg && (
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditOrg(!editOrg)}
                        className="shrink-0"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        {editOrg ? 'Lock' : 'Edit'}
                      </Button>
                    </div>
                  </FormField>
                </div>

                {/* College / Institute Name (auto-fill & read-only by default) */}
                <div className="relative">
                  <FormField
                    label="College / Institute Name"
                    htmlFor="collegeName"
                    error={errors.collegeName?.message}
                    required
                  >
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <Input
                          id="collegeName"
                          placeholder="e.g. MIT Pune"
                          readOnly={!editCollege}
                          className={!editCollege ? 'bg-muted/50 text-muted-foreground pr-8' : ''}
                          error={!!errors.collegeName}
                          {...register('collegeName')}
                        />
                        {!editCollege && (
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditCollege(!editCollege)}
                        className="shrink-0"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        {editCollege ? 'Lock' : 'Edit'}
                      </Button>
                    </div>
                  </FormField>
                </div>

                <FormField
                  label="Description"
                  htmlFor="description"
                  error={errors.description?.message}
                  required
                >
                  <textarea
                    id="description"
                    rows={5}
                    placeholder="Describe your event — what teams will do, kit contents, rules, etc."
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('description')}
                  />
                </FormField>
              </CardContent>
            </Card>
          </motion.div>

          {/* Banner Upload */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Event Banner</CardTitle>
              </CardHeader>
              <CardContent>
                {banner ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={banner.url}
                      alt="Event banner"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeBanner}
                      className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 hover:bg-background transition-colors"
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-48 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBannerUpload}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Upload className="h-5 w-5 animate-bounce" />
                        <span className="text-sm">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImagePlus className="h-8 w-8" />
                        <span className="text-sm font-medium">Click to upload banner</span>
                        <span className="text-xs">PNG, JPG up to 5MB</span>
                      </div>
                    )}
                  </label>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Date & Pricing */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Schedule & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Start Date"
                    htmlFor="startDate"
                    error={errors.startDate?.message}
                    required
                  >
                    <Input
                      id="startDate"
                      type="date"
                      leftIcon={<CalendarDays className="h-4 w-4" />}
                      error={!!errors.startDate}
                      {...register('startDate')}
                    />
                  </FormField>

                  <FormField
                    label="End Date"
                    htmlFor="endDate"
                    error={errors.endDate?.message}
                    required
                  >
                    <Input
                      id="endDate"
                      type="date"
                      leftIcon={<CalendarDays className="h-4 w-4" />}
                      error={!!errors.endDate}
                      {...register('endDate')}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Event Kit Selling Price (₹)"
                  htmlFor="eventKitPrice"
                  error={errors.eventKitPrice?.message}
                  required
                >
                  <Controller
                    name="eventKitPrice"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="eventKitPrice"
                        type="number"
                        min={0}
                        placeholder="e.g. 999"
                        leftIcon={<IndianRupee className="h-4 w-4" />}
                        error={!!errors.eventKitPrice}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    )}
                  />
                </FormField>

                <p className="text-xs text-muted-foreground">
                  This is the price students will pay for the event kit. You can use the Virtual Event Kit Builder on the Event Details page after creation.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/organizer/events')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createEvent.isPending || updateEvent.isPending}
                loadingText={isEditing ? 'Saving...' : 'Creating...'}
              >
                {isEditing ? 'Save Changes' : 'Create Event'}
              </Button>
            </div>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}
