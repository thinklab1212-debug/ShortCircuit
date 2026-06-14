// ============================================================================
// ElectroKart — Contact Controller
// ============================================================================
// Processes Contact Us inquiries, routing messages via Resend.
// ============================================================================

import { Request, Response } from 'express';
import { EmailService } from '../services/index.js';
import { ApiResponse, asyncHandler, ApiError } from '../utils/index.js';

/**
 * Handles sending contact inquiry emails using Resend.
 */
export const sendContactEmail = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  const success = await EmailService.sendContactInquiryEmail(name, email, subject, message);

  if (!success) {
    throw ApiError.internal('Failed to send contact inquiry. Please try again later.');
  }

  res.status(200).json(
    new ApiResponse(200, null, 'Message sent successfully. We will get back to you shortly.')
  );
});
