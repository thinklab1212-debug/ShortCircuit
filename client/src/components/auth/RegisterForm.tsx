import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react'
import { registerSchema, type RegisterFormValues } from '@/lib/validations/auth'
import { useRegister } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { fadeInUp, staggerContainer } from '@/config/animations'

// ─── Password Strength Indicator ────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Lowercase', pass: /[a-z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special char', pass: /[^A-Za-z0-9]/.test(password) },
  ]
  const passed = checks.filter((c) => c.pass).length
  const strength = passed <= 1 ? 'Weak' : passed <= 3 ? 'Fair' : passed <= 4 ? 'Good' : 'Strong'
  const color = passed <= 1 ? 'bg-error-500' : passed <= 3 ? 'bg-warning-500' : passed <= 4 ? 'bg-primary' : 'bg-success-500'

  if (!password) return null

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < passed ? color : 'bg-muted'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Password strength:</span>
        <span className={`text-xs font-medium ${passed <= 1 ? 'text-error-500' : passed <= 3 ? 'text-warning-600' : 'text-success-600'}`}>
          {strength}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((check) => (
          <span
            key={check.label}
            className={`text-[11px] ${check.pass ? 'text-success-600 dark:text-success-400' : 'text-muted-foreground'}`}
          >
            {check.pass ? '✓' : '○'} {check.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Register Form ──────────────────────────────────────────────────────────────
// Reusable register form used by both RegisterPage (page context) and AuthModal
// (modal context). Accepts optional callbacks; when omitted, falls back to
// <Link> based navigation matching the original page behavior.

interface RegisterFormProps {
  /** Called after successful registration — modal switches to login view. */
  onSuccess?: () => void
  /** Called when user clicks "Sign in" — modal switches view. */
  onSwitchToLogin?: () => void
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps = {}) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const registerMutation = useRegister({ onSuccess })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  })

  const watchedPassword = watch('password')

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      confirmPassword: data.confirmPassword,
    })
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="w-full max-w-md mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="text-center space-y-2">
        <h1 className="text-display-sm font-heading text-foreground">
          Create account
        </h1>
        <p className="text-body-md text-muted-foreground">
          Join Short Circuit for the best electronics deals
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        variants={fadeInUp}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="First name"
            htmlFor="reg-firstName"
            error={errors.firstName?.message}
            required
          >
            <Input
              id="reg-firstName"
              placeholder="John"
              autoComplete="given-name"
              leftIcon={<User className="h-4 w-4" />}
              error={!!errors.firstName}
              {...register('firstName')}
            />
          </FormField>
          <FormField
            label="Last name"
            htmlFor="reg-lastName"
            error={errors.lastName?.message}
            required
          >
            <Input
              id="reg-lastName"
              placeholder="Doe"
              autoComplete="family-name"
              error={!!errors.lastName}
              {...register('lastName')}
            />
          </FormField>
        </div>

        {/* Email */}
        <FormField
          label="Email address"
          htmlFor="reg-email"
          error={errors.email?.message}
          required
        >
          <Input
            id="reg-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            leftIcon={<Mail className="h-4 w-4" />}
            error={!!errors.email}
            {...register('email')}
          />
        </FormField>

        {/* Phone */}
        <FormField
          label="Mobile number"
          htmlFor="reg-phone"
          error={errors.phone?.message}
          required
        >
          <Input
            id="reg-phone"
            type="tel"
            placeholder="9876543210"
            autoComplete="tel"
            leftIcon={<Phone className="h-4 w-4" />}
            error={!!errors.phone}
            {...register('phone')}
          />
        </FormField>

        {/* Password */}
        <FormField
          label="Password"
          htmlFor="reg-password"
          error={errors.password?.message}
          required
        >
          <Input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            autoComplete="new-password"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={!!errors.password}
            {...register('password')}
          />
        </FormField>

        {/* Password Strength */}
        <PasswordStrength password={watchedPassword} />

        {/* Confirm Password */}
        <FormField
          label="Confirm password"
          htmlFor="reg-confirmPassword"
          error={errors.confirmPassword?.message}
          required
        >
          <Input
            id="reg-confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
        </FormField>

        {/* Terms */}
        <p className="text-xs text-muted-foreground">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-11"
          loading={registerMutation.isPending}
          loadingText="Creating account..."
          size="lg"
        >
          Create Account
        </Button>
      </motion.form>

      {/* Login Link */}
      <motion.p variants={fadeInUp} className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        {onSwitchToLogin ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Sign in
          </button>
        ) : (
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Sign in
          </Link>
        )}
      </motion.p>
    </motion.div>
  )
}
