// ============================================================================
// ElectroKart — Order Validators
// ============================================================================
// Defines input validation schemas for order processing: placing orders,
// updating order statuses, and logging shipping tracking updates.
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

// ---------------------------------------------------------------------------
// Constants & Allowed Enums
// ---------------------------------------------------------------------------

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
] as const;

export const PAYMENT_METHODS = ['razorpay', 'upi', 'cod'] as const;

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for placing an order from the user's current shopping cart.
 */
export const createOrderSchema = z.object({
  shippingAddressId: objectIdSchema,
  
  paymentMethod: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: "Payment method must be 'razorpay', 'upi', or 'cod'." }),
  }),
  
  email: z
    .string({ required_error: 'Order communication email is required.' })
    .trim()
    .email('Please provide a valid email address.'),
  
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(20, 'Coupon code must not exceed 20 characters')
    .optional(),
    
  customerNote: z
    .string()
    .trim()
    .max(500, 'Customer note must not exceed 500 characters')
    .optional(),
});

/**
 * Schema for updating an order status (Admin only).
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, {
    errorMap: () => ({
      message: 'Invalid order status. Must be placed, confirmed, processing, shipped, out_for_delivery, delivered, cancelled, or returned.',
    }),
  }),
  
  note: z
    .string()
    .trim()
    .max(500, 'Status update note must not exceed 500 characters')
    .optional(),
});

/**
 * Schema for updating shipping details and tracking ID (Admin only).
 */
export const trackingUpdateSchema = z.object({
  shippingCarrier: z
    .string({ required_error: 'Shipping carrier is required' })
    .trim()
    .min(2, 'Carrier name must be at least 2 characters'),
    
  shippingTrackingId: z
    .string({ required_error: 'Tracking ID is required' })
    .trim()
    .min(3, 'Tracking ID must be at least 3 characters'),
});

export const cancellationRequestSchema = z.object({
  category: z.enum([
    'ordered_by_mistake',
    'found_better_price',
    'delivery_delay',
    'address_issue',
    'financial_reason',
    'duplicate_order',
    'other'
  ], {
    errorMap: () => ({ message: 'Invalid cancellation category.' }),
  }),
  reason: z
    .string({ required_error: 'Reason is required.' })
    .trim()
    .min(20, 'Reason must be at least 20 characters.')
    .max(500, 'Reason must not exceed 500 characters.'),
});

export const adminReviewCancellationSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: "Action must be either 'approve' or 'reject'." }),
  }),
  adminResponse: z
    .string()
    .trim()
    .max(500, 'Customer response must not exceed 500 characters.')
    .optional(),
  internalAdminNote: z
    .string()
    .trim()
    .max(1000, 'Internal note must not exceed 1000 characters.')
    .optional(),
});

export default {
  createOrderSchema,
  updateOrderStatusSchema,
  trackingUpdateSchema,
  cancellationRequestSchema,
  adminReviewCancellationSchema,
  ORDER_STATUSES,
  PAYMENT_METHODS,
};
