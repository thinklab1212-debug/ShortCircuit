// ============================================================================
// ElectroKart — Contact Validators
// ============================================================================
// Validates incoming payloads for the contact form endpoint.
// ============================================================================

import { z } from 'zod';

export const sendContactEmailSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be at most 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address'),
  subject: z
    .string({ required_error: 'Subject is required' })
    .min(1, 'Subject cannot be empty')
    .max(200, 'Subject must be at most 200 characters'),
  message: z
    .string({ required_error: 'Message is required' })
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message must be at most 5000 characters'),
});
