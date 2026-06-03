// ============================================================================
// ElectroKart — Payment Routes
// ============================================================================
// Defines paths for Razorpay order creations, user signature verify, and webhook.
// ============================================================================

import { Router } from 'express';
import { PaymentController } from '../controllers/index.js';
import { authenticate, validate } from '../middlewares/index.js';
import { razorpayVerificationSchema } from '../validators/index.js';
import { z } from 'zod';

const router = Router();

/**
 * @openapi
 * /payments/create-order:
 *   post:
 *     summary: Request a new Razorpay order token (User only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, orderId]
 *             properties:
 *               amount:
 *                 type: number
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Razorpay order created
 */
router.post(
  '/create-order',
  authenticate,
  validate({
    body: z.object({
      amount: z.number({ required_error: 'Amount is required' }).min(1),
      orderId: z.string({ required_error: 'Order ID is required' }),
    }),
  }),
  PaymentController.createRazorpayOrder
);

/**
 * @openapi
 * /payments/verify:
 *   post:
 *     summary: Verify Razorpay payment signature (User only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId]
 *             properties:
 *               razorpayOrderId:
 *                 type: string
 *               razorpayPaymentId:
 *                 type: string
 *               razorpaySignature:
 *                 type: string
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signature verified and order confirmed
 */
router.post('/verify', authenticate, validate({ body: razorpayVerificationSchema }), PaymentController.verifyPayment);

/**
 * @openapi
 * /payments/webhook:
 *   post:
 *     summary: Handle incoming Razorpay webhook events (Public)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook', PaymentController.handleWebhook);

export default router;
