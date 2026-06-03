// ============================================================================
// ElectroKart — Wishlist Routes
// ============================================================================
// Defines paths for wishlist updates and item lists.
// ============================================================================

import { Router } from 'express';
import { WishlistController } from '../controllers/index.js';
import { authenticate, validate } from '../middlewares/index.js';
import { objectIdSchema } from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// All wishlist endpoints require authentication
router.use(authenticate);

/**
 * @openapi
 * /wishlist:
 *   get:
 *     summary: Retrieve user wishlist with active product details
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 */
router.get('/', WishlistController.getWishlist);

/**
 * @openapi
 * /wishlist/{productId}:
 *   post:
 *     summary: Toggle product presence in wishlist (adds if absent, removes if present)
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product toggled in wishlist successfully
 */
router.post('/:productId', validate({ params: z.object({ productId: objectIdSchema }) }), WishlistController.toggleWishlist);

/**
 * @openapi
 * /wishlist/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
 */
router.delete('/:productId', validate({ params: z.object({ productId: objectIdSchema }) }), WishlistController.removeFromWishlist);

export default router;
