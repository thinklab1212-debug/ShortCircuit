import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks'

// ─── Shop Search Bar ────────────────────────────────────────────────────────────

interface ShopSearchProps {
  value?: string
  onChange: (value: string | undefined) => void
  isSearching?: boolean
  className?: string
}

export default function ShopSearch({ value = '', onChange, isSearching = false, className }: ShopSearchProps) {
  const [local, setLocal] = useState(value)
  const [focused, setFocused] = useState(false)
  const debouncedValue = useDebounce(local, 400)
  const isInitialMount = useRef(true)

  // Sync from URL → local
  useEffect(() => {
    setLocal(value)
  }, [value])

  // Debounced push to URL
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    onChange(debouncedValue || undefined)
  }, [debouncedValue]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn('relative group', className)}>
      {/* Focus glow ring */}
      <div
        className={cn(
          'absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 opacity-0 blur-sm transition-opacity duration-300',
          focused && 'opacity-100'
        )}
      />

      <div className="relative">
        {/* Search / Loading icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-4.5 w-4.5 text-primary animate-spin" />
          ) : (
            <Search className={cn(
              'h-4.5 w-4.5 transition-colors duration-200',
              focused ? 'text-primary' : 'text-muted-foreground'
            )} />
          )}
        </div>

        <input
          type="search"
          placeholder="Search products, components, sensors..."
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            'w-full h-12 pl-12 pr-12 rounded-xl text-sm font-medium transition-all duration-200',
            'bg-background/70 backdrop-blur-lg border border-border/60',
            'placeholder:text-muted-foreground/60',
            'focus-visible:outline-none focus-visible:border-primary/50 focus-visible:bg-background',
            'hover:border-border hover:bg-background/90'
          )}
        />

        {local && (
          <button
            onClick={() => {
              setLocal('')
              onChange(undefined)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
