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

export const sendProductRequestSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be at most 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address'),
  productName: z
    .string({ required_error: 'Product name is required' })
    .min(1, 'Product name cannot be empty')
    .max(200, 'Product name must be at most 200 characters'),
  quantity: z
    .union([z.number().positive(), z.string()])
    .optional(),
  targetPrice: z
    .union([z.number().positive(), z.string()])
    .optional(),
  referenceUrl: z
    .string()
    .url('Please provide a valid URL')
    .optional()
    .or(z.literal('')),
  specifications: z
    .string()
    .max(3000, 'Specifications must be at most 3000 characters')
    .optional(),
  notes: z
    .string()
    .max(3000, 'Notes must be at most 3000 characters')
    .optional(),
});

