import * as React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

// ─── Label Component ────────────────────────────────────────────────────────────

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function Label({ className, children, required, ...props }: LabelProps) {
  return (
    <label
      className={cn('text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
      {...props}
    >
      {children}
      {required && <span className="text-error-500 ml-0.5">*</span>}
    </label>
  )
}

// ─── Form Field Wrapper ─────────────────────────────────────────────────────────

interface FormFieldProps {
  label?: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  success?: string
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  success,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-error-500">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
      {success && !error && (
        <p className="flex items-center gap-1.5 text-xs text-success-600">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          {success}
        </p>
      )}
      {hint && !error && !success && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3 w-3 shrink-0" />
          {hint}
        </p>
      )}
    </div>
  )
}

// ─── Input Group ────────────────────────────────────────────────────────────────

interface InputGroupProps {
  children: React.ReactNode
  className?: string
}

export function InputGroup({ children, className }: InputGroupProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      {children}
    </div>
  )
}

interface InputAddonProps {
  children: React.ReactNode
  position: 'left' | 'right'
  className?: string
}

export function InputAddon({ children, position, className }: InputAddonProps) {
  return (
    <div
      className={cn(
        'absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground',
        position === 'left' ? 'left-3' : 'right-3',
        className
      )}
    >
      {children}
    </div>
  )
}
