// ============================================================================
// ShortCircuit — Bulk Order Validators
// ============================================================================
// Defines input validation schemas for bulk quotation requests.
// ============================================================================

import { z } from 'zod';
import { objectIdSchema } from './common.validator.js';

export const bulkOrderItemSchema = z.object({
  productName: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(1, 'Product name cannot be empty')
    .max(200, 'Product name must not exceed 200 characters'),
  quantity: z.coerce
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than 0'),
  targetPrice: z.coerce
    .number()
    .nonnegative('Target price cannot be negative')
    .optional(),
  notes: z
    .string()
    .trim()
    .max(500, 'Notes must not exceed 500 characters')
    .optional(),
});

export const createBulkOrderSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name must not exceed 120 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(7, 'Phone number must be at least 7 characters')
    .max(20, 'Phone number must not exceed 20 characters'),
  organization: z
    .string()
    .trim()
    .max(150, 'Organization must not exceed 150 characters')
    .optional(),
  city: z
    .string()
    .trim()
    .max(100, 'City must not exceed 100 characters')
    .optional(),
  pincode: z
    .string()
    .trim()
    .max(10, 'Pincode must not exceed 10 characters')
    .optional(),
  items: z
    .array(bulkOrderItemSchema)
    .min(1, 'Please add at least one product with quantity'),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes must not exceed 2000 characters')
    .optional(),
});

export const updateBulkOrderStatusSchema = z.object({
  status: z.enum(['New', 'Under Review', 'Quote Sent', 'Completed', 'Cancelled'], {
    required_error: 'Status is required',
  }),
  adminNotes: z
    .string()
    .trim()
    .max(2000, 'Admin notes must not exceed 2000 characters')
    .optional(),
  quotedAmount: z.coerce
    .number()
    .nonnegative('Quoted amount cannot be negative')
    .optional(),
});

export const bulkOrderIdParamSchema = z.object({
  id: objectIdSchema,
});
