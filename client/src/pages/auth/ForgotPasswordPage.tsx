import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validations/auth'
import { useForgotPassword } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { fadeInUp, staggerContainer } from '@/config/animations'

// ─── Forgot Password Page ───────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const forgotMutation = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = (data: ForgotPasswordFormValues) => {
    setSubmittedEmail(data.email)
    forgotMutation.mutate(data, {
      onSuccess: () => setIsSuccess(true),
    })
  }

  // ── Success State ──
  if (isSuccess) {
    return (
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="w-full max-w-md mx-auto space-y-6 text-center"
      >
        <motion.div variants={fadeInUp}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-950/50 mb-4">
            <CheckCircle2 className="h-8 w-8 text-success-600 dark:text-success-400" />
          </div>
          <h1 className="text-display-xs font-heading text-foreground">
            Check your email
          </h1>
          <p className="mt-2 text-body-md text-muted-foreground">
            We&apos;ve sent a password reset link to
          </p>
          <p className="mt-1 font-semibold text-foreground">{submittedEmail}</p>
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setIsSuccess(false)
              forgotMutation.reset()
            }}
          >
            Try another email
          </Button>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </motion.div>
      </motion.div>
    )
  }

  // ── Form State ──
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
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-display-xs font-heading text-foreground">
          Forgot password?
        </h1>
        <p className="text-body-md text-muted-foreground">
          No worries, we&apos;ll send you reset instructions.
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        variants={fadeInUp}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <FormField
          label="Email address"
          htmlFor="email"
          error={errors.email?.message}
          required
        >
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            leftIcon={<Mail className="h-4 w-4" />}
            error={!!errors.email}
            autoFocus
            {...register('email')}
          />
        </FormField>

        <Button
          type="submit"
          className="w-full h-11"
          loading={forgotMutation.isPending}
          loadingText="Sending..."
          size="lg"
        >
          Send Reset Link
        </Button>
      </motion.form>

      {/* Back to Login */}
      <motion.div variants={fadeInUp} className="text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </motion.div>
    </motion.div>
  )
}
