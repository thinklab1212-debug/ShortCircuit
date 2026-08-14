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
  const userId = req.user!._id.toString();
  const { orderId } = req.body;

  // 1. Retrieve the corresponding Short Circuit Order from MongoDB using supplied orderId
  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found.');
  }

  // 2. Verify that the authenticated customer owns this order
  if (order.user.toString() !== userId) {
    throw ApiError.forbidden('You do not have permission to process payment for this order.');
  }

  // 3. Verify order eligibility for online payment
  if (order.paymentStatus === 'paid') {
    throw ApiError.badRequest('Order has already been paid.');
  }

  if (order.paymentStatus === 'refunded' || order.orderStatus === 'cancelled') {
    throw ApiError.badRequest('Cannot process payment for a cancelled or refunded order.');
  }

  if (order.orderStatus !== 'pending_payment' && order.orderStatus !== 'placed') {
    throw ApiError.badRequest(`Order is not eligible for online payment. Current status: ${order.orderStatus}`);
  }

  // 4. Obtain trusted amount from the stored Short Circuit order's totalPrice
  const razorpayOrder = await PaymentService.createRazorpayOrder(order.totalPrice, order._id.toString());

  // Store razorpayOrderId on the order document for payment tracking consistency
  order.paymentDetails = {
    ...order.paymentDetails,
    razorpayOrderId: razorpayOrder.id,
  };
  await order.save();

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
  const userId = req.user!._id.toString();
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  // 1. Retrieve the Short Circuit Order from MongoDB
  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found.');
  }

  // 2. Verify that the authenticated customer owns this order
  if (order.user.toString() !== userId) {
    throw ApiError.forbidden('You do not have permission to verify payment for this order.');
  }

  // 3. Application-level binding: compare submitted razorpayOrderId with stored razorpayOrderId
  if (!order.paymentDetails?.razorpayOrderId || order.paymentDetails.razorpayOrderId !== razorpayOrderId) {
    throw ApiError.badRequest('Payment verification failed. Razorpay Order ID mismatch.');
  }

  // 4. Cryptographic Razorpay signature verification
  const isValid = PaymentService.verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid) {
    throw ApiError.badRequest('Payment verification failed. Invalid signature.');
  }

  // 5. Fetch Razorpay payment details directly from Razorpay API
  const payment = await PaymentService.fetchRazorpayPayment(razorpayPaymentId);
  if (!payment) {
    throw ApiError.badRequest('Payment verification failed. Could not retrieve payment details.');
  }

  const expectedAmountPaise = Math.round(order.totalPrice * 100);
  const actualAmountPaise = Number(payment.amount);

  if (payment.id !== razorpayPaymentId) {
    throw ApiError.badRequest('Payment verification failed. Payment ID mismatch.');
  }

  if (payment.order_id !== razorpayOrderId) {
    throw ApiError.badRequest('Payment verification failed. Razorpay Order ID mismatch on fetched payment.');
  }

  if (payment.status !== 'captured') {
    throw ApiError.badRequest('Payment verification failed. Payment status is not captured.');
  }

  if (payment.currency !== 'INR') {
    throw ApiError.badRequest('Payment verification failed. Currency mismatch.');
  }

  if (!Number.isInteger(actualAmountPaise) || actualAmountPaise !== expectedAmountPaise) {
    throw ApiError.badRequest('Payment verification failed. Amount mismatch.');
  }

  // 6. Race-safe atomic payment state transition (only if pending_payment and unpaid)
  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      user: userId,
      'paymentDetails.razorpayOrderId': razorpayOrderId,
      orderStatus: 'pending_payment',
      paymentStatus: { $ne: 'paid' },
    },
    {
      $set: {
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        'paymentDetails.razorpayPaymentId': razorpayPaymentId,
        'paymentDetails.razorpaySignature': razorpaySignature,
      },
      $push: {
        statusHistory: {
          status: 'confirmed',
          timestamp: new Date(),
          note: 'Payment captured and verified via Razorpay.',
        },
      },
    },
    { new: true }
  );

  // If this execution performed the state transition, run side effects
  if (updatedOrder) {
    await CartService.clearCart(userId);

    const user = await User.findById(userId).select('email firstName');
    if (user) {
      EmailService.sendOrderConfirmationEmail(
        updatedOrder.shippingAddress.email || user.email,
        user.firstName,
        updatedOrder.orderId,
        updatedOrder.totalPrice
      );
    }
    return res.status(200).json(new ApiResponse(200, updatedOrder, 'Payment verified and order confirmed.'));
  }

  // If already paid (e.g. racing webhook completed first), return order idempotently without duplicate side-effects
  const existingOrder = await Order.findById(orderId);
  res.status(200).json(new ApiResponse(200, existingOrder || order, 'Payment verified and order confirmed.'));
});

export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  if (!signature) {
    throw ApiError.badRequest('Missing Razorpay signature header.');
  }

  const eventId = req.headers['x-razorpay-event-id'] as string | undefined;
  if (!eventId) {
    throw ApiError.badRequest('Missing Razorpay event ID header.');
  }

  // Verify webhook signature using exact raw request body bytes
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    throw ApiError.badRequest('Invalid webhook signature.');
  }

  const { event, payload } = req.body;

  if (event === 'payment.captured') {
    const paymentEntity = payload?.payment?.entity;
    if (!paymentEntity) {
      throw ApiError.badRequest('Invalid webhook payload structure.');
    }

    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;
    const actualAmountPaise = Number(paymentEntity.amount);
    const actualCurrency = paymentEntity.currency;
    const paymentStatus = paymentEntity.status;
    const isCaptured = paymentEntity.captured === true || paymentEntity.captured === 'true';

    if (!razorpayOrderId || !razorpayPaymentId) {
      throw ApiError.badRequest('Missing payment or order identification in webhook payload.');
    }

    if (paymentStatus !== 'captured' || !isCaptured) {
      throw ApiError.badRequest('Webhook payment state is not captured.');
    }

    if (actualCurrency !== 'INR') {
      throw ApiError.badRequest('Webhook payment currency mismatch.');
    }

    if (!Number.isInteger(actualAmountPaise)) {
      throw ApiError.badRequest('Invalid payment amount in webhook payload.');
    }

    // Retrieve order to verify expected amount
    const targetOrder = await Order.findOne({ 'paymentDetails.razorpayOrderId': razorpayOrderId });
    if (!targetOrder) {
      return res.status(200).json(new ApiResponse(200, null, 'Order not found for webhook event.'));
    }

    const expectedAmountPaise = Math.round(targetOrder.totalPrice * 100);
    if (actualAmountPaise !== expectedAmountPaise) {
      throw ApiError.badRequest('Webhook payment amount mismatch.');
    }

    // Atomic state transition: query by razorpayOrderId, orderStatus pending_payment, unpaid paymentStatus, AND eventId NOT in processedEvents
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: targetOrder._id,
        'paymentDetails.razorpayOrderId': razorpayOrderId,
        orderStatus: 'pending_payment',
        paymentStatus: { $nin: ['paid', 'refunded'] },
        'paymentDetails.processedEvents': { $ne: eventId },
      },
      {
        $set: {
          paymentStatus: 'paid',
          orderStatus: 'confirmed',
          'paymentDetails.razorpayPaymentId': razorpayPaymentId,
        },
        $addToSet: {
          'paymentDetails.processedEvents': eventId,
        },
        $push: {
          statusHistory: {
            status: 'confirmed',
            timestamp: new Date(),
            note: 'Payment captured via Razorpay Webhook.',
          },
        },
      },
      { new: true }
    );

    // Perform side effects only if this execution won the state transition
    if (updatedOrder) {
      const userId = updatedOrder.user.toString();
      await CartService.clearCart(userId);

      const user = await User.findById(userId).select('email firstName');
      if (user) {
        EmailService.sendOrderConfirmationEmail(
          updatedOrder.shippingAddress.email || user.email,
          user.firstName,
          updatedOrder.orderId,
          updatedOrder.totalPrice
        );
      }
    }
  } else if (event === 'payment.failed') {
    const paymentEntity = payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;

    if (razorpayOrderId) {
      // Prevent state regression: match only if payment is NOT paid or refunded
      await Order.findOneAndUpdate(
        {
          'paymentDetails.razorpayOrderId': razorpayOrderId,
          paymentStatus: { $nin: ['paid', 'refunded'] },
          'paymentDetails.processedEvents': { $ne: eventId },
        },
        {
          $set: {
            paymentStatus: 'failed',
          },
          $addToSet: {
            'paymentDetails.processedEvents': eventId,
          },
          $push: {
            statusHistory: {
              status: 'pending_payment',
              timestamp: new Date(),
              note: 'Payment attempt failed via Razorpay Webhook.',
            },
          },
        }
      );
    }
  }

  res.status(200).json(new ApiResponse(200, null, 'Webhook processed successfully.'));
});
