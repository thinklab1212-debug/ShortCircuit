import { useQuery, useMutation } from '@tanstack/react-query'
import { eventApi } from '@/services'
import queryKeys from '@/api/queryKeys'

// ─── Public Events Hooks ────────────────────────────────────────────────────────

/** Fetches approved events for public browse. */
export function usePublicEvents(params: { page?: number; limit?: number; search?: string; sortBy?: string }) {
  return useQuery({
    queryKey: queryKeys.publicEvents.list(params),
    queryFn: () =>
      eventApi.getPublicEvents(params).then((res) => ({
        events: res.data.data,
        pagination: res.data.pagination,
      })),
  })
}

/** Fetches detailed event details by slug. */
export function usePublicEventDetail(slug: string) {
  return useQuery({
    queryKey: queryKeys.publicEvents.detail(slug),
    queryFn: () => eventApi.getPublicEventBySlug(slug).then((res) => res.data.data),
    enabled: !!slug,
  })
}

/** Verifies a student's Team ID. */
export function useVerifyTeam() {
  return useMutation({
    mutationFn: ({ eventId, teamId }: { eventId: string; teamId: string }) =>
      eventApi.verifyTeam(eventId, teamId).then((res) => res.data.data),
    onError: () => {
      // Don't show toast automatically so page can display custom clean inline state
    },
  })
}

/** Fetches checkout price calculation values and details. */
export function useEventCheckout(eventId: string, token: string) {
  return useQuery({
    queryKey: ['eventCheckout', eventId, token],
    queryFn: () => eventApi.checkoutEventKit(eventId, token).then((res) => res.data.data),
    enabled: !!eventId && !!token,
    retry: false,
  })
}

/** Places an order or confirms a signature validation. */
export function usePurchaseEventKit() {
  return useMutation({
    mutationFn: ({
      eventId,
      verificationToken,
      addressId,
      paymentMethod,
      orderId,
      paymentDetails,
    }: {
      eventId: string
      verificationToken: string
      addressId: string
      paymentMethod: 'razorpay' | 'cod'
      orderId?: string
      paymentDetails?: any
    }) =>
      eventApi
        .purchaseEventKit(eventId, { verificationToken, addressId, paymentMethod, orderId, paymentDetails })
        .then((res) => res.data.data),
  })
}

/** Fetches purchases lists for organizers. */
export function useOrganizerEventPurchases(
  eventId: string,
  params: { page?: number; limit?: number; search?: string; paymentStatus?: string }
) {
  return useQuery({
    queryKey: queryKeys.organizerPurchases.list(eventId, params),
    queryFn: () =>
      eventApi.getOrganizerEventPurchases(eventId, params).then((res) => ({
        purchases: res.data.data,
        pagination: res.data.pagination,
      })),
    enabled: !!eventId,
  })
}

/** Fetches global event orders for admin. */
export function useAdminEventOrders(params: {
  page?: number
  limit?: number
  eventId?: string
  organizerId?: string
  paymentStatus?: string
  deliveryStatus?: string
}) {
  return useQuery({
    queryKey: queryKeys.adminEventOrders.list(params),
    queryFn: () =>
      eventApi.getAdminEventOrders(params).then((res) => ({
        orders: res.data.data,
        pagination: res.data.pagination,
      })),
  })
}

/** Fetches customer's purchased event orders. */
export function useCustomerEventOrders() {
  return useQuery({
    queryKey: queryKeys.customerEventOrders.list(),
    queryFn: () => eventApi.getCustomerEventOrders().then((res) => res.data.data),
  })
}
