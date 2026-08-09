// ============================================================================
// ElectroKart — Payment Validators
// ============================================================================
// Defines input validation schemas for verifying payment gateway responses.
// ============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for verifying Razorpay transaction signatures.
 */
export const razorpayVerificationSchema = z.object({
  razorpayOrderId: z
    .string({ required_error: 'Razorpay order ID is required' })
    .trim()
    .min(1, 'Razorpay order ID cannot be empty'),
    
  razorpayPaymentId: z
    .string({ required_error: 'Razorpay payment ID is required' })
    .trim()
    .min(1, 'Razorpay payment ID cannot be empty'),
    
  razorpaySignature: z
    .string({ required_error: 'Razorpay signature is required' })
    .trim()
    .min(1, 'Razorpay signature cannot be empty'),

  orderId: z
    .string({ required_error: 'Order ID is required' })
    .trim()
    .min(1, 'Order ID cannot be empty'),
});

export default {
  razorpayVerificationSchema,
};
