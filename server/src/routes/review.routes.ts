// ============================================================================
// ElectroKart — Review Routes
// ============================================================================
// Defines paths for product reviews. Supports parameter merging.
// Mounts under: /api/v1/products/:productId/reviews
// ============================================================================

import { Router } from 'express';
import { ReviewController } from '../controllers/index.js';
import { authenticate, validate } from '../middlewares/index.js';
import {
  createReviewSchema,
  updateReviewSchema,
  objectIdSchema,
  paginationQuerySchema,
} from '../validators/index.js';
import { z } from 'zod';

const router = Router({ mergeParams: true });

/**
 * @openapi
 * /products/{productId}/reviews:
 *   get:
 *     summary: Retrieve paginated product reviews list
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product reviews fetched successfully
 */
router.get('/', validate({ params: z.object({ productId: objectIdSchema }), query: paginationQuerySchema }), ReviewController.getProductReviews);

/**
 * @openapi
 * /products/{productId}/reviews:
 *   post:
 *     summary: Submit a review for a product (User only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating, title, comment]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted successfully
 */
router.post('/', authenticate, validate({ params: z.object({ productId: objectIdSchema }), body: createReviewSchema }), ReviewController.createReview);

/**
 * @openapi
 * /products/{productId}/reviews/{reviewId}:
 *   patch:
 *     summary: Update an existing review (User only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 */
router.patch('/:reviewId', authenticate, validate({ params: z.object({ reviewId: objectIdSchema }), body: updateReviewSchema }), ReviewController.updateReview);

/**
 * @openapi
 * /products/{productId}/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review (User or Admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 */
router.delete('/:reviewId', authenticate, validate({ params: z.object({ reviewId: objectIdSchema }) }), ReviewController.deleteReview);

export default router;
