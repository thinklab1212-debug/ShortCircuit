// ============================================================================
// ElectroKart — Order Routes
// ============================================================================
// Defines paths for user orders, cancellations, invoices, and admin management.
// ============================================================================

import { Router } from 'express';
import { OrderController } from '../controllers/index.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  trackingUpdateSchema,
  objectIdSchema,
  paginationQuerySchema,
} from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// All order endpoints require authentication
router.use(authenticate);

// User-specific endpoints
/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Place a new order from cart (User only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddressId, paymentMethod]
 *             properties:
 *               shippingAddressId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [razorpay, upi, cod]
 *               couponCode:
 *                 type: string
 *               customerNote:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order placed successfully
 */
router.post('/', validate({ body: createOrderSchema }), OrderController.placeOrder);

/**
 * @openapi
 * /orders:
 *   get:
 *     summary: Retrieve authenticated user orders list
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User orders list retrieved successfully
 */
router.get('/', validate({ query: paginationQuerySchema }), OrderController.getUserOrders);

/**
 * @openapi
 * /orders/{orderId}:
 *   get:
 *     summary: Retrieve single order details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 */
router.get('/:orderId', validate({ params: z.object({ orderId: objectIdSchema }) }), OrderController.getOrderById);

/**
 * @openapi
 * /orders/{orderId}/cancel:
 *   patch:
 *     summary: Cancel a user order before shipping
 *     tags: [Orders]
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
 *             required: [cancellationReason]
 *             properties:
 *               cancellationReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */
router.patch('/:orderId/cancel', validate({ params: z.object({ orderId: objectIdSchema }), body: z.object({ cancellationReason: z.string({ required_error: 'Cancellation reason is required' }).trim().min(5, 'Reason must be at least 5 characters') }) }), OrderController.cancelOrder);

/**
 * @openapi
 * /orders/{orderId}/invoice:
 *   get:
 *     summary: Fetch order invoice billing metadata
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice compiled successfully
 */
router.get('/:orderId/invoice', validate({ params: z.object({ orderId: objectIdSchema }) }), OrderController.downloadInvoice);

// Admin-only management endpoints
router.use(authorize('admin'));

/**
 * @openapi
 * /orders/admin/all:
 *   get:
 *     summary: Retrieve all orders list (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin orders list retrieved successfully
 */
router.get('/admin/all', validate({ query: paginationQuerySchema }), OrderController.getAllOrders);

/**
 * @openapi
 * /orders/admin/{orderId}:
 *   get:
 *     summary: Get details of any order (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 */
router.get('/admin/:orderId', validate({ params: z.object({ orderId: objectIdSchema }) }), OrderController.getAnyOrder);

/**
 * @openapi
 * /orders/admin/{orderId}/status:
 *   patch:
 *     summary: Modify order status (Admin only)
 *     tags: [Orders]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.patch('/admin/:orderId/status', validate({ params: z.object({ orderId: objectIdSchema }), body: updateOrderStatusSchema }), OrderController.updateOrderStatus);

/**
 * @openapi
 * /orders/admin/{orderId}/tracking:
 *   patch:
 *     summary: Update courier carrier tracking information (Admin only)
 *     tags: [Orders]
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
 *             required: [shippingCarrier, shippingTrackingId]
 *             properties:
 *               shippingCarrier:
 *                 type: string
 *               shippingTrackingId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tracking information updated
 */
router.patch('/admin/:orderId/tracking', validate({ params: z.object({ orderId: objectIdSchema }), body: trackingUpdateSchema }), OrderController.updateTrackingInfo);

export default router;
