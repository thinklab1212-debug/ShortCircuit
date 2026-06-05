// ============================================================================
// ElectroKart — Coupon Validators
// ============================================================================
// Defines input validation schemas for coupon creation, modification, and check.
// Enforces rules like expiration dates validation and caps on percentage values.
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

// ---------------------------------------------------------------------------
// Constants & Allowed Enums
// ---------------------------------------------------------------------------

export const DISCOUNT_TYPES = ['percentage', 'fixed'] as const;

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating a coupon (Admin only).
 */
const couponBaseSchema = z
  .object({
    code: z
      .string({ required_error: 'Coupon code is required' })
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{3,20}$/, 'Coupon code must be alphanumeric and between 3 and 20 characters'),
      
    description: z
      .string()
      .trim()
      .max(200, 'Description must not exceed 200 characters')
      .optional(),
      
    discountType: z.enum(DISCOUNT_TYPES, {
      errorMap: () => ({ message: "Discount type must be 'percentage' or 'fixed'." }),
    }),
    
    discountValue: z
      .number({ required_error: 'Discount value is required' })
      .positive('Discount value must be a positive number'),
      
    minOrderAmount: z
      .number()
      .nonnegative('Minimum order amount cannot be negative')
      .optional()
      .default(0),
      
    maxDiscount: z
      .number()
      .positive('Maximum discount must be a positive number')
      .optional(),
      
    validFrom: z
      .string({ required_error: 'Valid from date is required' })
      .datetime({ message: 'Valid from must be a valid ISO date-time string' })
      .transform((val) => new Date(val)),
      
    validUntil: z
      .string({ required_error: 'Valid until date is required' })
      .datetime({ message: 'Valid until must be a valid ISO date-time string' })
      .transform((val) => new Date(val)),
      
    usageLimit: z
      .number({ required_error: 'Usage limit is required' })
      .int()
      .positive('Usage limit must be a positive integer'),
      
    perUserLimit: z
      .number()
      .int()
      .positive('Per user limit must be a positive integer')
      .optional()
      .default(1),
      
    applicableCategories: z
      .array(objectIdSchema)
      .optional()
      .default([]),
      
    isActive: z
      .boolean()
      .optional()
      .default(true),
  });

const percentageCapRefinement = (data: { discountType?: string; discountValue?: number }) => {
  if (data.discountType === 'percentage' && data.discountValue !== undefined && data.discountValue > 100) {
    return false;
  }
  return true;
};

const dateRangeRefinement = (data: { validFrom?: Date; validUntil?: Date }) => {
  if (data.validFrom && data.validUntil) {
    return data.validUntil > data.validFrom;
  }
  return true;
};

/**
 * Schema for creating a coupon (Admin only).
 */
export const createCouponSchema = couponBaseSchema
  .refine(percentageCapRefinement, {
    message: 'Percentage discount cannot exceed 100%',
    path: ['discountValue'],
  })
  .refine(dateRangeRefinement, {
    message: 'Expiration date (validUntil) must be after the activation date (validFrom)',
    path: ['validUntil'],
  });

/**
 * Schema for updating an existing coupon.
 */
export const updateCouponSchema = couponBaseSchema
  .partial()
  .refine(percentageCapRefinement, {
    message: 'Percentage discount cannot exceed 100%',
    path: ['discountValue'],
  })
  .refine(dateRangeRefinement, {
    message: 'Expiration date (validUntil) must be after the activation date (validFrom)',
    path: ['validUntil'],
  });

/**
 * Schema for validating/applying a coupon on a cart.
 */
export const validateCouponSchema = z.object({
  code: z
    .string({ required_error: 'Coupon code is required' })
    .trim()
    .toUpperCase()
    .min(1, 'Coupon code cannot be empty'),
  cartTotal: z
    .number({ required_error: 'Cart total is required' })
    .nonnegative('Cart total cannot be negative'),
  cartCategoryIds: z
    .array(z.string())
    .optional()
    .default([]),
});

export default {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  DISCOUNT_TYPES,
};
