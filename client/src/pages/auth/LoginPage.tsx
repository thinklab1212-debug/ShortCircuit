import LoginForm from '@/components/auth/LoginForm'

// ─── Login Page ─────────────────────────────────────────────────────────────────
// Thin wrapper rendering the reusable LoginForm in page context.
// No callbacks are passed, so the form uses default navigation behavior
// (useLogin redirects via react-router after success).

export default function LoginPage() {
  return <LoginForm />
}
