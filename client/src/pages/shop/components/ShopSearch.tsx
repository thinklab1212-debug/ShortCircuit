import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks'

// ─── Shop Search Bar ────────────────────────────────────────────────────────────

interface ShopSearchProps {
  value?: string
  onChange: (value: string | undefined) => void
  className?: string
}

export default function ShopSearch({ value = '', onChange, className }: ShopSearchProps) {
  const [local, setLocal] = useState(value)
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
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="search"
        placeholder="Search products..."
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className={cn(
          'glass w-full h-10 pl-10 pr-10 rounded-lg text-sm transition-colors',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        )}
      />
      {local && (
        <button
          onClick={() => {
            setLocal('')
            onChange(undefined)
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
