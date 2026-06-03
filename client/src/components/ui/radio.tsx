import * as React from 'react'
import { cn } from '@/lib/utils'

// ─── Radio Group & Radio Item ───────────────────────────────────────────────────

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
}

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

export function RadioGroup({
  children,
  value,
  onValueChange,
  orientation = 'vertical',
  className,
  ...props
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div
        role="radiogroup"
        className={cn(
          'flex gap-3',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

// ─── Radio Item ─────────────────────────────────────────────────────────────────

interface RadioItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string
  label?: string
  description?: string
}

export function RadioItem({
  value,
  label,
  description,
  className,
  id,
  ...props
}: RadioItemProps) {
  const { value: groupValue, onValueChange } = React.useContext(RadioGroupContext)
  const inputId = id || React.useId()
  const isChecked = groupValue === value

  return (
    <div className="flex items-start gap-3">
      <div className="relative flex items-center justify-center">
        <input
          type="radio"
          id={inputId}
          value={value}
          checked={isChecked}
          onChange={() => onValueChange?.(value)}
          className={cn(
            'peer h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-full border-2 transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'hover:border-primary/40',
            isChecked ? 'border-primary' : 'border-input',
            className
          )}
          {...props}
        />
        <div
          className={cn(
            'absolute h-2.5 w-2.5 rounded-full bg-primary pointer-events-none transition-transform duration-150',
            isChecked ? 'scale-100' : 'scale-0'
          )}
        />
      </div>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label htmlFor={inputId} className="text-sm font-medium leading-none cursor-pointer text-foreground">
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
    </div>
  )
}
