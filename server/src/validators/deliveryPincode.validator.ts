// ============================================================================
// ShortCircuit — Delivery Pincode Validators
// ============================================================================
// Zod schemas for delivery pincode management (admin CRUD) and customer
// serviceability checks.
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

// ---------------------------------------------------------------------------
// Reusable pincode field
// ---------------------------------------------------------------------------

const pincodeField = z
  .string({ required_error: 'Pincode is required' })
  .trim()
  .regex(/^[1-9]\d{5}$/, 'Invalid pincode. Must be a valid 6-digit Indian postal code.');

// ---------------------------------------------------------------------------
// Customer: check serviceability
// ---------------------------------------------------------------------------

export const checkPincodeSchema = z.object({
  pincode: pincodeField,
});

// ---------------------------------------------------------------------------
// Admin: create delivery pincode
// ---------------------------------------------------------------------------

export const createDeliveryPincodeSchema = z.object({
  pincode: pincodeField,

  city: z
    .string()
    .trim()
    .max(100, 'City name must not exceed 100 characters')
    .optional(),

  state: z
    .string()
    .trim()
    .max(100, 'State name must not exceed 100 characters')
    .optional(),

  isActive: z
    .boolean()
    .optional()
    .default(true),
});

// ---------------------------------------------------------------------------
// Admin: update delivery pincode
// ---------------------------------------------------------------------------

export const updateDeliveryPincodeSchema = z.object({
  pincode: pincodeField.optional(),

  city: z
    .string()
    .trim()
    .max(100, 'City name must not exceed 100 characters')
    .optional(),

  state: z
    .string()
    .trim()
    .max(100, 'State name must not exceed 100 characters')
    .optional(),

  isActive: z
    .boolean()
    .optional(),
});

// ---------------------------------------------------------------------------
// Admin: toggle status
// ---------------------------------------------------------------------------

export const togglePincodeStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive status is required' }),
});

// ---------------------------------------------------------------------------
// Admin: params — id
// ---------------------------------------------------------------------------

export const deliveryPincodeIdSchema = z.object({
  id: objectIdSchema,
});

// ---------------------------------------------------------------------------
// Admin: list query params
// ---------------------------------------------------------------------------

export const deliveryPincodeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
});

export default {
  checkPincodeSchema,
  createDeliveryPincodeSchema,
  updateDeliveryPincodeSchema,
  togglePincodeStatusSchema,
  deliveryPincodeIdSchema,
  deliveryPincodeListQuerySchema,
};
