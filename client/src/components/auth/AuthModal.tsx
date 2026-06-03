import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap } from 'lucide-react'
import { useUIStore } from '@/store'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import { APP } from '@/constants'

// ─── Auth Modal ─────────────────────────────────────────────────────────────────
// Hybrid overlay: opens from the Navbar "Sign In" button. Renders LoginForm or
// RegisterForm with view-switching. The underlying page remains visible and the
// user returns to exactly the same state when the modal closes.
//
// Accessibility: role="dialog", aria-modal, focus-trap, ESC key, focus restore.
// Mobile: full-screen sheet with scrollable body.

// ─── Animation Variants ─────────────────────────────────────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15 },
  },
}

const mobileModalVariants = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 30, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: { duration: 0.2 },
  },
}

// ─── Focus Trap Hook ────────────────────────────────────────────────────────────

function useFocusTrap(containerRef: React.RefObject<HTMLDivElement | null>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector)
      if (focusableElements.length === 0) return

      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [containerRef, isActive])
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function AuthModal() {
  const navigate = useNavigate()
  const {
    isAuthModalOpen,
    authModalView,
    closeAuthModal,
    setAuthModalView,
  } = useUIStore()

  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Focus trap
  useFocusTrap(modalRef, isAuthModalOpen)

  // Store the element that triggered the modal for focus restoration
  useEffect(() => {
    if (isAuthModalOpen) {
      triggerRef.current = document.activeElement as HTMLElement
    }
  }, [isAuthModalOpen])

  // ESC key handler
  useEffect(() => {
    if (!isAuthModalOpen) return

    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeAuthModal()
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isAuthModalOpen, closeAuthModal])

  // Body scroll lock
  useEffect(() => {
    if (isAuthModalOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isAuthModalOpen])

  // Focus restoration on close
  useEffect(() => {
    if (!isAuthModalOpen && triggerRef.current) {
      triggerRef.current.focus()
      triggerRef.current = null
    }
  }, [isAuthModalOpen])

  // Initial focus on the modal when it opens
  useEffect(() => {
    if (isAuthModalOpen && modalRef.current) {
      // Short delay to ensure animation has started and form elements are rendered
      const timer = setTimeout(() => {
        const firstInput = modalRef.current?.querySelector<HTMLInputElement>('input:not([type="hidden"])')
        firstInput?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isAuthModalOpen, authModalView])

  // ── Callbacks for LoginForm ─────────────────────────────────────────────────

  const handleLoginSuccess = useCallback(() => {
    closeAuthModal()
    // User stays on current page — no navigation
  }, [closeAuthModal])

  const handleSwitchToRegister = useCallback(() => {
    setAuthModalView('register')
  }, [setAuthModalView])

  const handleForgotPassword = useCallback(() => {
    closeAuthModal()
    navigate('/forgot-password')
  }, [closeAuthModal, navigate])

  // ── Callbacks for RegisterForm ──────────────────────────────────────────────

  const handleRegisterSuccess = useCallback(() => {
    setAuthModalView('login')
    // Toast "Account created!" is shown by useRegister hook
  }, [setAuthModalView])

  const handleSwitchToLogin = useCallback(() => {
    setAuthModalView('login')
  }, [setAuthModalView])

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            key="auth-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeAuthModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Panel — Desktop */}
          <motion.div
            key="auth-modal-desktop"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 hidden lg:flex flex-col w-full max-w-[480px] max-h-[90vh] rounded-2xl border border-border/60 bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">{APP.NAME}</span>
              </div>
              <button
                onClick={closeAuthModal}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Close authentication dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex mx-6 mb-2 rounded-lg bg-muted/50 p-1" role="tablist" aria-label="Authentication method">
              <button
                role="tab"
                aria-selected={authModalView === 'login'}
                onClick={() => setAuthModalView('login')}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                  authModalView === 'login'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={authModalView === 'register'}
                onClick={() => setAuthModalView('register')}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                  authModalView === 'register'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form Area — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-6" role="tabpanel">
              <AnimatePresence mode="wait">
                {authModalView === 'login' ? (
                  <motion.div
                    key="login-view"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LoginForm
                      onSuccess={handleLoginSuccess}
                      onSwitchToRegister={handleSwitchToRegister}
                      onForgotPassword={handleForgotPassword}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="register-view"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RegisterForm
                      onSuccess={handleRegisterSuccess}
                      onSwitchToLogin={handleSwitchToLogin}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Modal Panel — Mobile (full-screen sheet) */}
          <motion.div
            key="auth-modal-mobile"
            ref={!modalRef.current ? modalRef : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title-mobile"
            variants={mobileModalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 flex lg:hidden flex-col w-full h-full bg-background overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">{APP.NAME}</span>
              </div>
              <button
                onClick={closeAuthModal}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Close authentication dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex mx-4 mb-2 rounded-lg bg-muted/50 p-1 shrink-0" role="tablist" aria-label="Authentication method">
              <button
                role="tab"
                aria-selected={authModalView === 'login'}
                onClick={() => setAuthModalView('login')}
                className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-all ${
                  authModalView === 'login'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={authModalView === 'register'}
                onClick={() => setAuthModalView('register')}
                className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-all ${
                  authModalView === 'register'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form Area — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 pb-6" role="tabpanel">
              <AnimatePresence mode="wait">
                {authModalView === 'login' ? (
                  <motion.div
                    key="login-view-mobile"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LoginForm
                      onSuccess={handleLoginSuccess}
                      onSwitchToRegister={handleSwitchToRegister}
                      onForgotPassword={handleForgotPassword}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="register-view-mobile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RegisterForm
                      onSuccess={handleRegisterSuccess}
                      onSwitchToLogin={handleSwitchToLogin}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
