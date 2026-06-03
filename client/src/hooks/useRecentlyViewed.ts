import { useState, useEffect } from 'react'
import type { Product } from '@/types'
import { effectivePrice, primaryImage } from '@/utils'

// ─── Recently Viewed Products ───────────────────────────────────────────────────

const STORAGE_KEY = 'electrokart-recently-viewed'
const MAX_ITEMS = 10

interface RecentProduct {
  _id: string
  name: string
  slug: string
  image: string
  price: number
  mrp: number
  ratingsAverage: number
  ratingsCount: number
}

function getStored(): RecentProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveStored(items: RecentProduct[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage full — silently ignore
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentProduct[]>(getStored)

  const addProduct = (product: Product) => {
    const entry: RecentProduct = {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      image: primaryImage(product),
      price: effectivePrice(product),
      mrp: product.price,
      ratingsAverage: product.ratingsAverage,
      ratingsCount: product.ratingsCount,
    }

    setItems((prev) => {
      const filtered = prev.filter((p) => p._id !== product._id)
      const next = [entry, ...filtered].slice(0, MAX_ITEMS)
      saveStored(next)
      return next
    })
  }

  return { items, addProduct }
}

// Track viewing a product on page mount
export function useTrackView(product: Product | undefined) {
  const { addProduct } = useRecentlyViewed()

  useEffect(() => {
    if (product) {
      addProduct(product)
    }
  }, [product?._id]) // eslint-disable-line react-hooks/exhaustive-deps
}
