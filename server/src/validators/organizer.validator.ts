// ============================================================================
// Short Circuit — Organizer Validators
// ============================================================================
// Zod schemas for organizer application operations: submitting applications
// and admin review actions (approve/reject).
//
// Business logic is NOT implemented here — only input shape validation.
// Actual implementation will be added in Phase 2.
// ============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Customer: Submit Organizer Application
// ---------------------------------------------------------------------------

export const applyOrganizerSchema = z.object({
  organizationName: z
    .string({ required_error: 'Organization name is required' })
    .trim()
    .min(3, 'Organization name must be at least 3 characters')
    .max(150, 'Organization name cannot exceed 150 characters'),

  collegeName: z
    .string({ required_error: 'College name is required' })
    .trim()
    .min(3, 'College name must be at least 3 characters')
    .max(200, 'College name cannot exceed 200 characters'),

  contactNumber: z
    .string({ required_error: 'Contact number is required' })
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
});

// ---------------------------------------------------------------------------
// Admin: Review Organizer Application
// ---------------------------------------------------------------------------

export const reviewOrganizerApplicationSchema = z.object({
  adminResponse: z
    .string()
    .trim()
    .max(500, 'Admin response cannot exceed 500 characters')
    .optional(),
});
