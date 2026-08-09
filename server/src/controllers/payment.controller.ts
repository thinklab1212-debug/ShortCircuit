// ============================================================================
// ElectroKart — Payment Controller
// ============================================================================
// Processes Razorpay payments, signature verifications, and webhooks.
// ============================================================================

import { Request, Response } from 'express';
import crypto from 'crypto';
import { PaymentService, CartService, EmailService } from '../services/index.js';
import { ApiResponse, asyncHandler, ApiError } from '../utils/index.js';
import Order from '../models/Order.model.js';
import User from '../models/User.model.js';
import { env } from '../config/env.js';

export const createRazorpayOrder = asyncHandler(async (req: Request, res: Response) => {
  const { amount, orderId } = req.body;
  const razorpayOrder = await PaymentService.createRazorpayOrder(amount, orderId);
  res.status(200).json(
    new ApiResponse(
      200,
      {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: env.RAZORPAY_KEY_ID,
      },
      'Razorpay order created successfully.'
    )
  );
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  const isValid = PaymentService.verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid) {
    throw ApiError.badRequest('Payment verification failed. Invalid signature.');
  }

  // Update order status in database
  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found.');
  }

  order.paymentStatus = 'paid';
  order.orderStatus = 'confirmed';
  order.paymentDetails = {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  };
  order.statusHistory.push({
    status: 'confirmed',
    timestamp: new Date(),
    note: 'Payment captured and verified via Razorpay.',
  });

  await order.save();

  // Clear the user's cart (deferred from order creation for online payments)
  const userId = order.user.toString();
  await CartService.clearCart(userId);

  // Send Order Confirmation Email (non-blocking)
  const user = await User.findById(userId).select('email firstName');
  if (user) {
    EmailService.sendOrderConfirmationEmail(
      order.shippingAddress.email || user.email,
      user.firstName,
      order.orderId,
      order.totalPrice
    );
  }

  res.status(200).json(new ApiResponse(200, order, 'Payment verified and order confirmed.'));
});

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  if (!signature) {
    throw ApiError.badRequest('Missing Razorpay signature header.');
  }

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    throw ApiError.badRequest('Invalid webhook signature.');
  }

  const { event, payload } = req.body;

  if (event === 'payment.captured') {
    const paymentEntity = payload.payment.entity;
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    // Find order by Razorpay Order ID
    const order = await Order.findOne({ 'paymentDetails.razorpayOrderId': razorpayOrderId });
    if (order && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.orderStatus = 'confirmed';
      order.paymentDetails = {
        ...order.paymentDetails,
        razorpayPaymentId,
      };
      order.statusHistory.push({
        status: 'confirmed',
        timestamp: new Date(),
        note: 'Payment captured via Razorpay Webhook.',
      });
      await order.save();
    }
  }

  res.status(200).json(new ApiResponse(200, null, 'Webhook processed successfully.'));
});
