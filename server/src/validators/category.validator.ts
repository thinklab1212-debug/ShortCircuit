// ============================================================================
// ElectroKart — Category Validators
// ============================================================================
// Defines input validation schemas for creating and updating product categories.
// Supports self-referencing parent categories.
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating a category.
 */
export const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required' })
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must not exceed 100 characters'),
    
  description: z
    .string()
    .trim()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
    
  icon: z
    .string()
    .trim()
    .max(50, 'Icon name or class must not exceed 50 characters')
    .optional(),
    
  parent: objectIdSchema.optional(),
  
  isActive: z
    .boolean()
    .optional()
    .default(true),
    
  displayOrder: z
    .number()
    .int()
    .optional()
    .default(0),
});

/**
 * Schema for updating an existing category.
 */
export const updateCategorySchema = createCategorySchema.partial();

export default {
  createCategorySchema,
  updateCategorySchema,
};
