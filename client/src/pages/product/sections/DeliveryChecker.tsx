import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCheckPincode } from '@/hooks'
import type { PincodeCheckResult } from '@/types'

// ─── Session-level cache to avoid redundant API calls ───────────────────────

const pincodeCache = new Map<string, PincodeCheckResult>()

const ease = [0.4, 0, 0.2, 1] as [number, number, number, number]

// ─── DeliveryChecker ────────────────────────────────────────────────────────

export default function DeliveryChecker() {
  const [pincode, setPincode] = useState('')
  const [result, setResult] = useState<PincodeCheckResult | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const checkMutation = useCheckPincode()

  // Allow only digits, max 6
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPincode(value)
    if (result) setResult(null)
    if (error) setError('')
  }

  const handleCheck = useCallback(() => {
    const trimmed = pincode.trim()

    if (!trimmed) {
      setError('Please enter a pincode')
      inputRef.current?.focus()
      return
    }
    if (!/^[1-9]\d{5}$/.test(trimmed)) {
      setError('Enter a valid 6-digit pincode')
      return
    }

    setError('')

    // Check cache first
    const cached = pincodeCache.get(trimmed)
    if (cached) {
      setResult(cached)
      return
    }

    checkMutation.mutate(trimmed, {
      onSuccess: (data) => {
        pincodeCache.set(trimmed, data)
        setResult(data)
      },
      onError: () => {
        setError('Unable to check. Please try again.')
      },
    })
  }, [pincode, checkMutation])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCheck()
    }
  }

  const handleChangePincode = () => {
    setResult(null)
    setError('')
    setPincode('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const isChecking = checkMutation.isPending

  return (
    <div className="space-y-3">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Check Delivery</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Check delivery availability at your location
        </p>
      </div>

      {/* Input row */}
      {!result ? (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              ref={inputRef}
              id="delivery-pincode-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pincode}
              onChange={handlePincodeChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter 6-digit pincode"
              leftIcon={<MapPin className="h-4 w-4" />}
              error={!!error}
              aria-label="Delivery pincode"
              aria-describedby={error ? 'pincode-error' : undefined}
              disabled={isChecking}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleCheck}
              disabled={isChecking || pincode.length < 6}
              className="sm:w-auto w-full shrink-0 font-medium"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                'Check'
              )}
            </Button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                id="pincode-error"
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-xs text-destructive"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Result Card with smooth motion */
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease }}
          className="space-y-2"
        >
          {result.deliverable ? (
            <div
              className="flex items-start gap-2.5 rounded-lg border border-success-200 bg-success-50/60 dark:border-success-800/40 dark:bg-success-950/20 px-3.5 py-2.5"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-success-600 dark:text-success-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-success-700 dark:text-success-300">
                  Delivery available
                </p>
                <p className="text-xs text-success-600/80 dark:text-success-400/70 mt-0.5">
                  We can deliver this product to <span className="font-semibold">{result.pincode}</span>.
                </p>
              </div>
            </div>
          ) : (
            <div
              className="flex items-start gap-2.5 rounded-lg border border-warning-200 bg-warning-50/60 dark:border-warning-800/40 dark:bg-warning-950/20 px-3.5 py-2.5"
              role="alert"
              aria-live="polite"
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-warning-600 dark:text-warning-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-warning-700 dark:text-warning-300">
                  Not Deliverable
                </p>
                <p className="text-xs text-warning-600/80 dark:text-warning-400/70 mt-0.5">
                  This product is not deliverable at pincode <span className="font-semibold">{result.pincode}</span>.
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleChangePincode}
            className="text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
          >
            Change Pincode
          </button>
        </motion.div>
      )}
    </div>
  )
}
