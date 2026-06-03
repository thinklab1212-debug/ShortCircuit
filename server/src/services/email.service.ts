// ============================================================================
// ElectroKart — Email Service
// ============================================================================
// Manages sending structured transactional emails using the Resend client.
// Supports custom HTML templating for welcome, password resets, and orders.
// ============================================================================

import { resend } from '../config/resend.js';
import { env } from '../config/env.js';
import { logger } from '../utils/index.js';

export class EmailService {
  /**
   * General-purpose email sender.
   */
  private static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const response = await resend.emails.send({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });

      if (response.error) {
        logger.error(`❌ Resend Email Error: ${response.error.message}`, response.error);
        return false;
      }

      logger.info(`📧 Transactional email sent successfully to: ${to} (Subject: "${subject}")`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to send transactional email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Sends a welcome email upon user registration.
   */
  public static async sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
    const subject = 'Welcome to ElectroKart! ⚡';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">Welcome to ElectroKart!</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for creating an account with ElectroKart. We are thrilled to have you as part of our community of engineering students and makers!</p>
        <p>ElectroKart provides startup-ready electronics components, development boards (Arduino, ESP32, Raspberry Pi), robotics kits, drone electronics, and engineering tools at students-friendly prices.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.CLIENT_URL}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Start Exploring Catalog</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eeeeee;" />
        <p style="font-size: 12px; color: #777777; text-align: center;">This is an automated transactional email from ElectroKart. Please do not reply directly.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  /**
   * Sends a password reset instruction email.
   */
  public static async sendPasswordResetEmail(to: string, firstName: string, resetUrl: string): Promise<boolean> {
    const subject = 'ElectroKart — Reset Your Password 🔑';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #dc2626; text-align: center;">Password Reset Request</h2>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your password for your ElectroKart account. Click the button below to choose a new password. This link is valid for 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
        <p>If you did not make this request, you can safely ignore this email — your password will remain secure.</p>
        <hr style="border: 0; border-top: 1px solid #eeeeee;" />
        <p style="font-size: 12px; color: #777777; text-align: center;">This is an automated transactional email from ElectroKart.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  /**
   * Sends an order placement confirmation email.
   */
  public static async sendOrderConfirmationEmail(to: string, firstName: string, orderId: string, totalPrice: number): Promise<boolean> {
    const subject = `Order Confirmed: ${orderId} 📦`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #10b981; text-align: center;">Order Confirmed!</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for shopping at ElectroKart! Your order <strong>${orderId}</strong> has been successfully placed.</p>
        <p>We are preparing your components for shipping. You will receive a tracking link as soon as your order has been dispatched.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #374151;">Order Summary</h4>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${totalPrice.toFixed(2)}</p>
        </div>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${env.CLIENT_URL}/profile/orders" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Order History</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eeeeee;" />
        <p style="font-size: 12px; color: #777777; text-align: center;">This is an automated transactional email from ElectroKart.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }
}

export default EmailService;
