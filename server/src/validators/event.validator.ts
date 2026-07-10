// ============================================================================
// Short Circuit — Event Validators
// ============================================================================
// Zod schemas for event operations: creation, update, team CSV upload,
// team verification, submission for review, and event kit purchase.
//
// Pricing note:
//   - kitProducts includes productName and priceAtCreation (price snapshots)
//   - eventKitPrice is the organizer-set selling price
//   - totalKitValue and discount are computed server-side, never sent by client
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

// ---------------------------------------------------------------------------
// Organizer: Create Event
// ---------------------------------------------------------------------------

export const createEventSchema = z.object({
  eventName: z
    .string({ required_error: 'Event name is required' })
    .trim()
    .min(3, 'Event name must be at least 3 characters')
    .max(200, 'Event name cannot exceed 200 characters'),

  organizationName: z
    .string({ required_error: 'Organization name is required' })
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .max(200, 'Organization name cannot exceed 200 characters'),

  collegeName: z
    .string({ required_error: 'College name is required' })
    .trim()
    .min(3, 'College name must be at least 3 characters')
    .max(200, 'College name cannot exceed 200 characters'),

  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),

  banner: z.object({
    url: z.string({ required_error: 'Banner URL is required' }).url('Invalid URL'),
    publicId: z.string({ required_error: 'Banner public ID is required' }),
  }),

  startDate: z
    .string({ required_error: 'Start date is required' })
    .datetime('Invalid date format'),

  endDate: z
    .string({ required_error: 'End date is required' })
    .datetime('Invalid date format'),

  eventKitPrice: z
    .number({ required_error: 'Event kit price is required' })
    .min(0, 'Event kit price cannot be negative')
    .default(0),

  kitProducts: z
    .array(
      z.object({
        product: objectIdSchema,
        productName: z
          .string({ required_error: 'Product name is required' })
          .trim()
          .min(1, 'Product name cannot be empty'),
        productSku: z
          .string({ required_error: 'Product SKU is required' })
          .trim()
          .min(1, 'Product SKU cannot be empty'),
        productImage: z.string().optional(),
        priceAtCreation: z
          .number({ required_error: 'Price at creation is required' })
          .min(0, 'Price cannot be negative'),
        quantity: z
          .number({ required_error: 'Quantity is required' })
          .int('Quantity must be a whole number')
          .min(1, 'Quantity must be at least 1')
          .max(100, 'Quantity cannot exceed 100'),
      })
    )
    .optional()
    .default([]),
});

// ---------------------------------------------------------------------------
// Organizer: Update Event (partial — only draft/rejected events)
// ---------------------------------------------------------------------------

export const updateEventSchema = createEventSchema.partial();

// ---------------------------------------------------------------------------
// Student: Verify Team
// ---------------------------------------------------------------------------

export const verifyTeamSchema = z.object({
  teamId: z
    .string({ required_error: 'Team ID is required' })
    .trim()
    .min(2, 'Team ID must be at least 2 characters')
    .max(50, 'Team ID cannot exceed 50 characters'),
});

// ---------------------------------------------------------------------------
// Student: Purchase Event Kit
// ---------------------------------------------------------------------------

export const purchaseEventKitSchema = z.object({
  verificationToken: z
    .string({ required_error: 'Verification token is required' })
    .trim(),
  addressId: objectIdSchema,
  paymentMethod: z.enum(['razorpay', 'cod'], {
    required_error: 'Payment method is required',
  }),
  paymentDetails: z
    .object({
      razorpayOrderId: z.string().optional(),
      razorpayPaymentId: z.string().optional(),
      razorpaySignature: z.string().optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// Admin: Reject Event
// ---------------------------------------------------------------------------

export const rejectEventSchema = z.object({
  rejectionReason: z
    .string({ required_error: 'Rejection reason is required' })
    .trim()
    .min(5, 'Rejection reason must be at least 5 characters')
    .max(500, 'Rejection reason cannot exceed 500 characters'),
});
