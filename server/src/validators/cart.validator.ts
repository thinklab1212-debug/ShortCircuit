// ============================================================================
// ElectroKart — Cart Validators
// ============================================================================
// Defines input validation schemas for cart operations: adding products
// and updating item quantities (enforcing purchase limits).
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for adding an item to the shopping cart.
 * Limits purchase of a single item to at most 10 units in one request.
 */
export const addToCartSchema = z.object({
  productId: objectIdSchema,
  
  variant: z
    .object({
      name: z.string().trim().min(1, 'Variant name cannot be empty'),
      value: z.string().trim().min(1, 'Variant option value cannot be empty'),
    })
    .optional(),
    
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(10, 'You can purchase a maximum of 10 units of this product at a time'),
});

/**
 * Schema for updating an item's quantity in the cart.
 */
export const updateCartItemSchema = z.object({
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(10, 'You can purchase a maximum of 10 units of this product at a time'),
});

export default {
  addToCartSchema,
  updateCartItemSchema,
};
