import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Checkbox Component ─────────────────────────────────────────────────────────

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  error?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            className={cn(
              'peer h-4.5 w-4.5 shrink-0 cursor-pointer appearance-none rounded border transition-all duration-150',
              'checked:bg-primary checked:border-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'hover:border-primary/40',
              error ? 'border-error-500' : 'border-input',
              className
            )}
            style={{ width: '18px', height: '18px' }}
            {...props}
          />
          <Check className="absolute h-3 w-3 text-primary-foreground pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>
        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <label htmlFor={inputId} className="text-sm font-medium leading-none cursor-pointer text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {error && (
              <p className="text-xs text-error-500">{error}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
