import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Package,
  MapPin,
  LogOut,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store'
import { useUpdateProfile, useUpdateAvatar, useChangePassword, useLogout, useMyOrganizerApplication, useApplyAsOrganizer } from '@/hooks'
import { getUserName, getInitials } from '@/utils'
import { fadeInUp, staggerContainer } from '@/config/animations'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number')
    .or(z.literal('')),
})
type ProfileFormValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
type PasswordFormValues = z.infer<typeof passwordSchema>

const organizerSchema = z.object({
  organizationName: z
    .string()
    .min(3, 'Organization name must be at least 3 characters')
    .max(150, 'Organization name cannot exceed 150 characters'),
  collegeName: z
    .string()
    .min(3, 'College name must be at least 3 characters')
    .max(200, 'College name cannot exceed 200 characters'),
  contactNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
})
type OrganizerFormValues = z.infer<typeof organizerSchema>

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useUpdateProfile()
  const updateAvatar = useUpdateAvatar()
  const changePassword = useChangePassword()
  const logout = useLogout()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showOrganizerForm, setShowOrganizerForm] = useState(false)
  const { data: myApplication, isLoading: appLoading } = useMyOrganizerApplication()
  const applyAsOrganizer = useApplyAsOrganizer()

  const {
    register: registerOrganizer,
    handleSubmit: handleOrganizerSubmit,
    formState: { errors: organizerErrors },
  } = useForm<OrganizerFormValues>({
    resolver: zodResolver(organizerSchema),
  })

  const onOrganizerSubmit = (data: OrganizerFormValues) => {
    applyAsOrganizer.mutate(data, {
      onSuccess: () => setShowOrganizerForm(false),
    })
  }

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  })

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || undefined,
    })
  }

  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePassword.mutate(data, { onSuccess: () => resetPassword() })
  }

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) updateAvatar.mutate(file)
    e.target.value = ''
  }

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6">
        <h1 className="text-display-xs sm:text-display-sm font-heading text-foreground">
          My Account
        </h1>
        <p className="mt-1 text-body-md text-muted-foreground">
          Manage your profile, security and preferences
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Profile Info */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-lg font-semibold text-muted-foreground">
                    {user?.avatar?.url ? (
                      <img
                        src={user.avatar.url}
                        alt={getUserName(user)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(getUserName(user) || 'U')
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={updateAvatar.isPending}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                    aria-label="Change photo"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onAvatarChange}
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground">{getUserName(user) || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <Separator />

              {/* Form */}
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FormField
                    label="First name"
                    htmlFor="firstName"
                    error={profileErrors.firstName?.message}
                    required
                  >
                    <Input
                      id="firstName"
                      leftIcon={<UserIcon className="h-4 w-4" />}
                      error={!!profileErrors.firstName}
                      {...registerProfile('firstName')}
                    />
                  </FormField>
                  <FormField
                    label="Last name"
                    htmlFor="lastName"
                    error={profileErrors.lastName?.message}
                    required
                  >
                    <Input
                      id="lastName"
                      leftIcon={<UserIcon className="h-4 w-4" />}
                      error={!!profileErrors.lastName}
                      {...registerProfile('lastName')}
                    />
                  </FormField>
                </div>

                <FormField label="Phone" htmlFor="phone" error={profileErrors.phone?.message}>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    leftIcon={<Phone className="h-4 w-4" />}
                    error={!!profileErrors.phone}
                    {...registerProfile('phone')}
                  />
                </FormField>

                <FormField label="Email address" htmlFor="email" hint="Email cannot be changed">
                  <Input
                    id="email"
                    type="email"
                    value={user?.email ?? ''}
                    readOnly
                    disabled
                    leftIcon={<Mail className="h-4 w-4" />}
                  />
                </FormField>

                <Button
                  type="submit"
                  loading={updateProfile.isPending}
                  loadingText="Saving..."
                >
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
                <FormField
                  label="Current password"
                  htmlFor="currentPassword"
                  error={passwordErrors.currentPassword?.message}
                  required
                >
                  <Input
                    id="currentPassword"
                    type={showCurrent ? 'text' : 'password'}
                    autoComplete="current-password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowCurrent((s) => !s)}
                        tabIndex={-1}
                        aria-label={showCurrent ? 'Hide password' : 'Show password'}
                        className="hover:text-foreground transition-colors"
                      >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    error={!!passwordErrors.currentPassword}
                    {...registerPassword('currentPassword')}
                  />
                </FormField>

                <FormField
                  label="New password"
                  htmlFor="newPassword"
                  error={passwordErrors.newPassword?.message}
                  required
                >
                  <Input
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowNew((s) => !s)}
                        tabIndex={-1}
                        aria-label={showNew ? 'Hide password' : 'Show password'}
                        className="hover:text-foreground transition-colors"
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    error={!!passwordErrors.newPassword}
                    {...registerPassword('newPassword')}
                  />
                </FormField>

                <FormField
                  label="Confirm new password"
                  htmlFor="confirmNewPassword"
                  error={passwordErrors.confirmNewPassword?.message}
                  required
                >
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    autoComplete="new-password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    error={!!passwordErrors.confirmNewPassword}
                    {...registerPassword('confirmNewPassword')}
                  />
                </FormField>

                <Button
                  type="submit"
                  loading={changePassword.isPending}
                  loadingText="Updating..."
                >
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div variants={fadeInUp} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/orders">
                  <Package className="h-4 w-4 mr-2" />
                  My Orders
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/addresses">
                  <MapPin className="h-4 w-4 mr-2" />
                  Saved Addresses
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/events">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Events
                </Link>
              </Button>
              <Separator className="my-2" />
              <Button
                variant="soft-destructive"
                className="w-full justify-start"
                loading={logout.isPending}
                onClick={() => logout.mutate()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Become an Organizer Card */}
          {!appLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Event Organizer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Already an organizer */}
                {user?.isOrganizer && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span className="font-medium">Approved Organizer</span>
                    </div>
                    {user.organizerProfile && (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{user.organizerProfile.organizationName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{user.organizerProfile.collegeName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{user.organizerProfile.contactNumber}</span>
                        </div>
                        {user.organizerProfile.approvedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Approved on {new Date(user.organizerProfile.approvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    )}
                    <Button asChild className="w-full">
                      <Link to="/organizer">
                        <Award className="h-4 w-4 mr-2" />
                        Open Organizer Dashboard
                      </Link>
                    </Button>
                  </div>
                )}

                {/* No application yet */}
                {!user?.isOrganizer && !myApplication && !showOrganizerForm && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Want to sell event kits on Short Circuit? Apply to become an event organizer.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowOrganizerForm(true)}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Become an Organizer
                    </Button>
                  </div>
                )}

                {/* Pending application */}
                {!user?.isOrganizer && myApplication?.status === 'pending' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>Your application is under review. We'll notify you once it's processed.</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted as <strong>{myApplication.organizationName}</strong>
                    </p>
                  </div>
                )}

                {/* Rejected application */}
                {!user?.isOrganizer && myApplication?.status === 'rejected' && !showOrganizerForm && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>Your application was rejected.</span>
                    </div>
                    {myApplication.adminResponse && (
                      <p className="text-xs text-muted-foreground">
                        <strong>Reason:</strong> {myApplication.adminResponse}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowOrganizerForm(true)}
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Reapply
                    </Button>
                  </div>
                )}

                {/* Application Form */}
                {!user?.isOrganizer && showOrganizerForm && (
                  <form onSubmit={handleOrganizerSubmit(onOrganizerSubmit)} className="space-y-4">
                    <FormField
                      label="Organization / Club Name"
                      htmlFor="organizationName"
                      error={organizerErrors.organizationName?.message}
                      required
                    >
                      <Input
                        id="organizationName"
                        placeholder="e.g. IEEE Student Branch"
                        leftIcon={<Building2 className="h-4 w-4" />}
                        error={!!organizerErrors.organizationName}
                        {...registerOrganizer('organizationName')}
                      />
                    </FormField>
                    <FormField
                      label="College / Institute Name"
                      htmlFor="collegeName"
                      error={organizerErrors.collegeName?.message}
                      required
                    >
                      <Input
                        id="collegeName"
                        placeholder="e.g. MIT Pune"
                        error={!!organizerErrors.collegeName}
                        {...registerOrganizer('collegeName')}
                      />
                    </FormField>
                    <FormField
                      label="Contact Number"
                      htmlFor="contactNumber"
                      error={organizerErrors.contactNumber?.message}
                      required
                    >
                      <Input
                        id="contactNumber"
                        placeholder="e.g. 9876543210"
                        leftIcon={<Phone className="h-4 w-4" />}
                        error={!!organizerErrors.contactNumber}
                        {...registerOrganizer('contactNumber')}
                      />
                    </FormField>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowOrganizerForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        loading={applyAsOrganizer.isPending}
                        loadingText="Submitting..."
                      >
                        Submit
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
