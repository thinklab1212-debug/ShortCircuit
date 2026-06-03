import RegisterForm from '@/components/auth/RegisterForm'

// ─── Register Page ──────────────────────────────────────────────────────────────
// Thin wrapper rendering the reusable RegisterForm in page context.
// No callbacks are passed, so the form uses default navigation behavior
// (useRegister navigates to /login after success).

export default function RegisterPage() {
  return <RegisterForm />
}
