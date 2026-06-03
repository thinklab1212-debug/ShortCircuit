import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Button Variants ────────────────────────────────────────────────────────────

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.985]',
  {
    variants: {
      variant: {
        default:
          'bg-foreground text-background shadow-sm hover:bg-foreground/90 hover:shadow-md',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md',
        outline:
          'border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:border-border',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90',
        ghost:
          'hover:bg-accent hover:text-accent-foreground',
        link:
          'text-primary underline-offset-4 hover:underline active:scale-100',
        // Extended variants
        success:
          'bg-success-500 text-white shadow-sm hover:bg-success-600 hover:shadow-md',
        warning:
          'bg-warning-500 text-white shadow-sm hover:bg-warning-600 hover:shadow-md',
        gradient:
          'bg-foreground text-background shadow-sm hover:bg-foreground/90 hover:shadow-md',
        'gradient-outline':
          'relative border border-input bg-background p-[1px] rounded-lg hover:border-primary/40 [&>span]:bg-background [&>span]:rounded-[calc(0.625rem-1px)] [&>span]:px-4 [&>span]:py-2 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-2 [&>span]:text-foreground [&>span]:transition-colors',
        'soft-primary':
          'bg-primary/10 text-primary hover:bg-primary/15',
        'soft-success':
          'bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-950/50 dark:text-success-300 dark:hover:bg-success-900/50',
        'soft-warning':
          'bg-warning-50 text-warning-700 hover:bg-warning-100 dark:bg-warning-950/50 dark:text-warning-300 dark:hover:bg-warning-900/50',
        'soft-destructive':
          'bg-error-50 text-error-700 hover:bg-error-100 dark:bg-error-950/50 dark:text-error-300 dark:hover:bg-error-900/50',
      },
      size: {
        xs: 'h-7 rounded-lg px-2 text-xs [&_svg]:size-3',
        sm: 'h-9 rounded-lg px-3 text-xs [&_svg]:size-3.5',
        default: 'h-10 px-4 py-2 [&_svg]:size-4',
        lg: 'h-11 rounded-lg px-6 text-sm [&_svg]:size-4',
        xl: 'h-12 rounded-lg px-8 text-base [&_svg]:size-5',
        '2xl': 'h-14 rounded-xl px-10 text-lg [&_svg]:size-5',
        icon: 'h-10 w-10 [&_svg]:size-4',
        'icon-sm': 'h-8 w-8 [&_svg]:size-3.5',
        'icon-lg': 'h-12 w-12 [&_svg]:size-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

// ─── Button Props ───────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

// ─── Button Component ───────────────────────────────────────────────────────────

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = disabled || loading

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          disabled={isDisabled}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" />}
        {!loading && leftIcon}
        {loading && loadingText ? loadingText : children}
        {!loading && rightIcon}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

// ─── Icon Button ────────────────────────────────────────────────────────────────

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon: React.ReactNode
  label: string
  loading?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'icon', icon, label, loading, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        aria-label={label}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" /> : icon}
      </button>
    )
  }
)
IconButton.displayName = 'IconButton'

export { Button, IconButton, buttonVariants }
