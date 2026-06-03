// ============================================================================
// ElectroKart — Review Validators
// ============================================================================
// Defines input validation schemas for creating and updating product reviews.
// Enforces ratings bounds (1-5 stars) and minimum feedback comments lengths.
// ============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating a review.
 */
export const createReviewSchema = z.object({
  rating: z
    .number({ required_error: 'Rating is required' })
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars'),
    
  title: z
    .string()
    .trim()
    .max(150, 'Review title must not exceed 150 characters')
    .optional(),
    
  comment: z
    .string({ required_error: 'Comment is required' })
    .trim()
    .min(10, 'Review comment must be at least 10 characters')
    .max(2000, 'Review comment must not exceed 2000 characters'),
});

/**
 * Schema for updating an existing review.
 */
export const updateReviewSchema = createReviewSchema.partial();

export default {
  createReviewSchema,
  updateReviewSchema,
};
