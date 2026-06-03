// ============================================================================
// ElectroKart — Common Zod Schemas
// ============================================================================
// Contains shared validation fragments reused across multiple validators,
// including MongoDB ObjectIds and standard pagination query parameters.
// ============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// 1. MongoDB ObjectId Validator
// ---------------------------------------------------------------------------

/**
 * Validates a standard 24-character hexadecimal MongoDB ObjectId.
 */
export const objectIdSchema = z
  .string({
    required_error: 'ID is required',
    invalid_type_error: 'ID must be a string',
  })
  .regex(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid ID format. Must be a 24-character hex string.',
  });

// ---------------------------------------------------------------------------
// 2. Pagination and Sorting Validator
// ---------------------------------------------------------------------------

/**
 * Validates standard query parameters used for pagination and sorting.
 * Automatically transforms query string params into typed integers/defaults.
 */
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1))
    .pipe(z.number().int().min(1)),
    
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, Math.min(100, parseInt(val, 10))) : 10))
    .pipe(z.number().int().min(1).max(100)),
    
  sort: z
    .string()
    .optional()
    .default('createdAt'),
    
  order: z
    .enum(['asc', 'desc', 'ASC', 'DESC'])
    .optional()
    .default('desc')
    .transform((val) => val.toLowerCase() as 'asc' | 'desc'),
});

export default {
  objectIdSchema,
  paginationQuerySchema,
};
