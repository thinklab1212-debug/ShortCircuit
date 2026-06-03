// ============================================================================
// ElectroKart — Wishlist Validators
// ============================================================================
// Defines input validation schemas for wishlist actions (e.g., toggling item).
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for toggling a product in the wishlist (add/remove).
 */
export const toggleWishlistSchema = z.object({
  productId: objectIdSchema,
});

export default {
  toggleWishlistSchema,
};
