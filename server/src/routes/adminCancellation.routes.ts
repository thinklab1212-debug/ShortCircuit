// ============================================================================
// ElectroKart — Admin Cancellation Routes
// ============================================================================
// Defines paths for administrators to view, query pending count, and review
// order cancellation requests.
// ============================================================================

import { Router } from 'express';
import { OrderController } from '../controllers/index.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import {
  adminReviewCancellationSchema,
  objectIdSchema,
  paginationQuerySchema,
} from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// All administrative endpoints require authentication and admin privileges
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @openapi
 * /admin/cancellation-requests:
 *   get:
 *     summary: Retrieve cancellation requests list (Admin only)
 *     tags: [Admin Cancellation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of cancellation requests retrieved successfully
 */
router.get('/', validate({ query: paginationQuerySchema }), OrderController.getCancellationRequests);

/**
 * @openapi
 * /admin/cancellation-requests/pending-count:
 *   get:
 *     summary: Retrieve number of pending cancellation requests (Admin only)
 *     tags: [Admin Cancellation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending cancellation count retrieved successfully
 */
router.get('/pending-count', OrderController.getPendingCancellationCount);

/**
 * @openapi
 * /admin/cancellation-requests/{orderId}:
 *   patch:
 *     summary: Approve or reject a cancellation request (Admin only)
 *     tags: [Admin Cancellation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               adminResponse:
 *                 type: string
 *               internalAdminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request processed successfully
 */
router.patch('/:orderId', validate({ params: z.object({ orderId: objectIdSchema }), body: adminReviewCancellationSchema }), OrderController.reviewCancellationRequest);

export default router;
