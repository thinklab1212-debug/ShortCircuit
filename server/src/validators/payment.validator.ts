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
  razorpay_order_id: z
    .string({ required_error: 'Razorpay order ID is required' })
    .trim()
    .min(1, 'Razorpay order ID cannot be empty'),
    
  razorpay_payment_id: z
    .string({ required_error: 'Razorpay payment ID is required' })
    .trim()
    .min(1, 'Razorpay payment ID cannot be empty'),
    
  razorpay_signature: z
    .string({ required_error: 'Razorpay signature is required' })
    .trim()
    .min(1, 'Razorpay signature cannot be empty'),
});

export default {
  razorpayVerificationSchema,
};
