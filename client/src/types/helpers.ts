// Shared lightweight helpers for hook ergonomics.

export type { AddToCartData } from '@/types'

/** Minimal shape of an Axios error we read message off of. */
export interface AxiosErrorLike {
  response?: { data?: { message?: string } }
  message?: string
}
