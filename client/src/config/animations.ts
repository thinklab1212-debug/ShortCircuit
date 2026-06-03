import type { Variants, Transition } from 'framer-motion'

// ─── ElectroKart Animation Standards ────────────────────────────────────────────

// ─── Timing Constants ───────────────────────────────────────────────────────────

export const DURATION = {
  instant: 0.075,
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  slower: 0.5,
  page: 0.4,
} as const

// Easing curves typed as proper tuples for Framer Motion
const ease = [0.4, 0, 0.2, 1] as [number, number, number, number]
const easeOut = [0, 0, 0.2, 1] as [number, number, number, number]

export const EASE = {
  default: ease,
  in: [0.4, 0, 1, 1] as [number, number, number, number],
  out: easeOut,
  inOut: ease,
  spring: { type: 'spring' as const, damping: 25, stiffness: 300 },
  springBouncy: { type: 'spring' as const, damping: 15, stiffness: 200 },
  springGentle: { type: 'spring' as const, damping: 30, stiffness: 200 },
} as const

// ─── Page Transitions ───────────────────────────────────────────────────────────

export const pageTransition: Transition = {
  duration: DURATION.page,
  ease,
}

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export const pageFadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

// ─── Container / Stagger ────────────────────────────────────────────────────────

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
}

// ─── Stagger Children ───────────────────────────────────────────────────────────

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease },
  },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease },
  },
}

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.slow, ease },
  },
}

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.slow, ease },
  },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.normal, ease },
  },
}

// ─── Hover / Tap Interactions ───────────────────────────────────────────────────

export const hoverScale = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: { duration: DURATION.fast },
}

export const hoverScaleSubtle = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.99 },
  transition: { duration: DURATION.fast },
}

export const hoverLift = {
  whileHover: { y: -4, transition: { duration: DURATION.normal } },
  whileTap: { y: 0 },
}

export const hoverGlow = {
  whileHover: {
    boxShadow: '0 0 0 1px rgba(37, 99, 235, 0.2)',
    transition: { duration: DURATION.normal },
  },
}

// ─── Drawer / Slide Animations ──────────────────────────────────────────────────

export const slideInRight: Variants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: EASE.spring },
  exit: { x: '100%', transition: { duration: DURATION.slow } },
}

export const slideInLeft: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0, transition: EASE.spring },
  exit: { x: '-100%', transition: { duration: DURATION.slow } },
}

export const slideInBottom: Variants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: EASE.spring },
  exit: { y: '100%', transition: { duration: DURATION.slow } },
}

// ─── Modal / Dialog ─────────────────────────────────────────────────────────────

export const modalOverlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION.fast } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
}

export const modalContentVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: DURATION.fast },
  },
}

// ─── Dropdown ───────────────────────────────────────────────────────────────────

export const dropdownVariants: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION.fast, ease },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.96,
    transition: { duration: DURATION.instant },
  },
}

// ─── Product Card ───────────────────────────────────────────────────────────────

export const productCardVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease },
  },
}

export const productImageHover = {
  whileHover: { scale: 1.08 },
  transition: { duration: DURATION.slow },
}

export const wishlistHeartVariants: Variants = {
  initial: { scale: 1 },
  tap: { scale: 0.7 },
  liked: {
    scale: [1, 1.3, 1],
    transition: { duration: 0.3 },
  },
}

// ─── Loading States ─────────────────────────────────────────────────────────────

export const skeletonPulse: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 0.3, 0.6],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
}

// ─── Notification / Toast ───────────────────────────────────────────────────────

export const toastVariants: Variants = {
  initial: { opacity: 0, x: 50, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: EASE.spring,
  },
  exit: {
    opacity: 0,
    x: 50,
    scale: 0.95,
    transition: { duration: DURATION.fast },
  },
}

// ─── Count Up (for analytics) ───────────────────────────────────────────────────

export const countUpVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slower, ease: easeOut },
  },
}
