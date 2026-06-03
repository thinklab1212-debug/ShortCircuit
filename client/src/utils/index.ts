// ─── Format Utilities ───────────────────────────────────────────────────────────

/**
 * Format price in Indian Rupees
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }
  return new Date(date).toLocaleDateString('en-IN', defaultOptions)
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calculate discount percentage between a list price and a selling price.
 */
export function calcDiscount(mrp: number, price: number): number {
  if (mrp <= 0 || price >= mrp) return 0
  return Math.round(((mrp - price) / mrp) * 100)
}

// ─── Product Helpers ────────────────────────────────────────────────────────────

interface PricedProduct {
  price: number
  salePrice?: number
  discount?: number
  images?: { url: string; isPrimary?: boolean }[]
}

/** The price the customer actually pays (salePrice when present). */
export function effectivePrice(product: PricedProduct): number {
  return product.salePrice ?? product.price
}

/** Discount % for a product, preferring the server-computed value. */
export function productDiscount(product: PricedProduct): number {
  if (product.discount && product.discount > 0) return Math.round(product.discount)
  if (product.salePrice && product.salePrice < product.price) {
    return calcDiscount(product.price, product.salePrice)
  }
  return 0
}

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#f1f5f9"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="#94a3b8" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>'
  )

/** Primary image URL for a product, with a graceful placeholder fallback. */
export function primaryImage(product: { images?: { url: string; isPrimary?: boolean }[] }): string {
  const images = product.images || []
  const primary = images.find((img) => img.isPrimary)
  return primary?.url || images[0]?.url || PLACEHOLDER_IMAGE
}

/** Full display name for a user. */
export function getUserName(user?: { firstName?: string; lastName?: string } | null): string {
  if (!user) return ''
  return [user.firstName, user.lastName].filter(Boolean).join(' ')
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Generate star rating array
 */
export function getStarRating(rating: number): ('full' | 'half' | 'empty')[] {
  const stars: ('full' | 'half' | 'empty')[] = []
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push('full')
    else if (rating >= i - 0.5) stars.push('half')
    else stars.push('empty')
  }
  return stars
}

/**
 * Slugify string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

/**
 * Build query string from params object
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Pluralize a word
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

/**
 * Format large numbers (1000 → 1K, 1000000 → 1M)
 */
export function formatCompact(num: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(num)
}

/**
 * Safe parse JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}
