import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, ShieldCheck, AlertTriangle } from 'lucide-react'
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validations/auth'
import { useResetPassword } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { fadeInUp, staggerContainer } from '@/config/animations'

// ─── Reset Password Page ────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const resetMutation = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // ── Missing Token ──
  if (!token) {
    return (
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="w-full max-w-md mx-auto space-y-6 text-center"
      >
        <motion.div variants={fadeInUp}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-950/50 mb-4">
            <AlertTriangle className="h-8 w-8 text-warning-600 dark:text-warning-400" />
          </div>
          <h1 className="text-display-xs font-heading text-foreground">
            Invalid Reset Link
          </h1>
          <p className="mt-2 text-body-md text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
        </motion.div>
        <motion.div variants={fadeInUp}>
          <Button asChild variant="outline" className="w-full">
            <Link to="/forgot-password">Request a New Link</Link>
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  const onSubmit = (data: ResetPasswordFormValues) => {
    resetMutation.mutate({
      token,
      data: { password: data.password, confirmPassword: data.confirmPassword },
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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-display-xs font-heading text-foreground">
          Set new password
        </h1>
        <p className="text-body-md text-muted-foreground">
          Your new password must be different from previously used passwords.
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        variants={fadeInUp}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {/* New Password */}
        <FormField
          label="New password"
          htmlFor="password"
          error={errors.password?.message}
          required
        >
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter new password"
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
            autoFocus
            {...register('password')}
          />
        </FormField>

        {/* Confirm Password */}
        <FormField
          label="Confirm new password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
          required
        >
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter new password"
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

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-11"
          loading={resetMutation.isPending}
          loadingText="Resetting..."
          size="lg"
        >
          Reset Password
        </Button>
      </motion.form>

      {/* Back to Login */}
      <motion.p variants={fadeInUp} className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  )
}
