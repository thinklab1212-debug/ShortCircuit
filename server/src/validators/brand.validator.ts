// ============================================================================
// ElectroKart — Brand Validators
// ============================================================================
// Defines input validation schemas for creating and updating product brands.
// ============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating a brand.
 */
export const createBrandSchema = z.object({
  name: z
    .string({ required_error: 'Brand name is required' })
    .trim()
    .min(1, 'Brand name must be at least 1 character')
    .max(100, 'Brand name must not exceed 100 characters'),
    
  description: z
    .string()
    .trim()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
    
  website: z
    .string()
    .trim()
    .url('Website must be a valid URL')
    .optional(),
    
  countryOfOrigin: z
    .string()
    .trim()
    .max(100, 'Country name must not exceed 100 characters')
    .optional(),
    
  isActive: z
    .boolean()
    .optional()
    .default(true),
});

/**
 * Schema for updating an existing brand.
 */
export const updateBrandSchema = createBrandSchema.partial();

export default {
  createBrandSchema,
  updateBrandSchema,
};
