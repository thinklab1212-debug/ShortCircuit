// ─── Short Circuit Design Tokens ────────────────────────────────────────────────
// Single source of truth for all visual design values

export const tokens = {
  // ─── Color Palette ──────────────────────────────────────────────────────────
  colors: {
    // Primary — Engineering Blue
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },

    // Secondary — Neutral Slate
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },

    // Accent — Steel Gray
    accent: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },

    // Success — Emerald
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },

    // Warning — Amber
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },

    // Error — Rose
    error: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
    },

    // Neutral — Zinc
    neutral: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
  },

  // ─── Typography ─────────────────────────────────────────────────────────────
  fonts: {
    heading: "'Outfit', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },

  fontSizes: {
    // Headings
    'display-2xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
    'display-xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
    'display-lg': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
    'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
    'display-sm': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
    'display-xs': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.005em', fontWeight: '600' }],

    // Body
    'body-xl': ['1.25rem', { lineHeight: '1.6', fontWeight: '400' }],
    'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
    'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
    'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
    'body-xs': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],

    // Labels
    'label-lg': ['0.875rem', { lineHeight: '1.4', fontWeight: '600' }],
    'label-md': ['0.8125rem', { lineHeight: '1.4', fontWeight: '500' }],
    'label-sm': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
    'label-xs': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500' }],
  },

  // ─── Spacing Scale ──────────────────────────────────────────────────────────
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    48: '12rem',      // 192px
    56: '14rem',      // 224px
    64: '16rem',      // 256px
  },

  // ─── Container Widths ───────────────────────────────────────────────────────
  containers: {
    xs: '20rem',     // 320px
    sm: '24rem',     // 384px
    md: '28rem',     // 448px
    lg: '32rem',     // 512px
    xl: '36rem',     // 576px
    '2xl': '42rem',  // 672px
    '3xl': '48rem',  // 768px
    '4xl': '56rem',  // 896px
    '5xl': '64rem',  // 1024px
    '6xl': '72rem',  // 1152px
    '7xl': '80rem',  // 1280px
    full: '87.5rem', // 1400px
  },

  // ─── Breakpoints ────────────────────────────────────────────────────────────
  breakpoints: {
    xs: '475px',     // Small mobile
    sm: '640px',     // Large mobile
    md: '768px',     // Tablet
    lg: '1024px',    // Laptop
    xl: '1280px',    // Desktop
    '2xl': '1536px', // Ultra-wide
  },

  // ─── Border Radius ──────────────────────────────────────────────────────────
  radii: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    DEFAULT: '0.5rem', // 8px
    lg: '0.625rem',   // 10px — controls
    xl: '0.875rem',   // 14px — cards
    '2xl': '1.125rem',// 18px — feature surfaces
    '3xl': '1.125rem',
    full: '9999px',
  },

  // ─── Shadows ────────────────────────────────────────────────────────────────
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    glow: '0 0 0 1px rgb(37 99 235 / 0.22)',
    'glow-lg': '0 0 0 2px rgb(37 99 235 / 0.18)',
    card: '0 1px 2px rgb(15 23 42 / 0.06), 0 8px 24px -16px rgb(15 23 42 / 0.2)',
    'card-hover': '0 2px 6px rgb(15 23 42 / 0.08), 0 16px 32px -18px rgb(15 23 42 / 0.24)',
    float: '0 8px 20px -12px rgb(15 23 42 / 0.24)',
  },

  // ─── Z-Index Scale ──────────────────────────────────────────────────────────
  zIndex: {
    hide: -1,
    base: 0,
    docked: 10,
    dropdown: 20,
    sticky: 30,
    overlay: 40,
    modal: 50,
    popover: 60,
    toast: 70,
    tooltip: 80,
  },

  // ─── Transitions ────────────────────────────────────────────────────────────
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // ─── Animations ─────────────────────────────────────────────────────────────
  animations: {
    duration: {
      instant: '75ms',
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
      page: '400ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
} as const

export type DesignTokens = typeof tokens
export default tokens
