// ============================================================================
// ElectroKart — Payment Service
// ============================================================================
// Handles Razorpay order creations, HMAC payment verification signatures,
// COD status mappings, and refund creations.
// ============================================================================

import crypto from 'crypto';
import { razorpay } from '../config/razorpay.js';
import { env } from '../config/env.js';
import { ApiError, logger } from '../utils/index.js';

export class PaymentService {
  /**
   * Requests a new order token from Razorpay.
   *
   * @param amount - Order total in Rupees (₹)
   * @param orderId - ElectroKart Order ID
   */
  public static async createRazorpayOrder(
    amount: number,
    orderId: string
  ): Promise<{ id: string; amount: number; currency: string }> {
    logger.info(`💳 Requesting Razorpay Order for EK ID: ${orderId}, Amount: ₹${amount}`);
    
    // Amount in Razorpay must be passed in paise (1 INR = 100 paise)
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: orderId,
    };

    try {
      const razorpayOrder = await razorpay.orders.create(options);
      
      logger.info(`✅ Razorpay Order Token issued: ${razorpayOrder.id}`);
      return {
        id: razorpayOrder.id,
        amount: Number(razorpayOrder.amount),
        currency: razorpayOrder.currency,
      };
    } catch (error: any) {
      logger.error('❌ Razorpay order creation failed:', error);
      throw new ApiError(500, `Payment gateway communication failure: ${error.message}`);
    }
  }

  /**
   * Verifies Razorpay payment signatures using SHA256 HMAC encryption.
   */
  public static verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    logger.info(`🔐 Verifying signature for Razorpay Order: ${razorpayOrderId}`);
    
    const signatureBody = `${razorpayOrderId}|${razorpayPaymentId}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(signatureBody)
      .digest('hex');

    const isValid = expectedSignature === razorpaySignature;
    
    if (isValid) {
      logger.info('✅ Razorpay payment signature verified successfully.');
    } else {
      logger.warn('❌ Razorpay signature mismatch! Possible fraud attempt.');
    }

    return isValid;
  }

  /**
   * Initiates a refund for an order through the Razorpay SDK.
   */
  public static async refundPayment(
    paymentId: string,
    amount: number,
    notes: Record<string, string> = {}
  ): Promise<{ id: string; status: string }> {
    logger.info(`💸 Initiating refund for Razorpay Payment: ${paymentId}, Amount: ₹${amount}`);
    
    const options = {
      amount: Math.round(amount * 100), // in paise
      notes,
    };

    try {
      const refund = await razorpay.payments.refund(paymentId, options);
      
      logger.info(`✅ Refund processed successfully. Refund ID: ${refund.id}`);
      return {
        id: refund.id,
        status: refund.status,
      };
    } catch (error: any) {
      logger.error(`❌ Refund execution failed for Payment ${paymentId}:`, error);
      throw new ApiError(500, `Refund processing failed: ${error.message}`);
    }
  }
}

export default PaymentService;
