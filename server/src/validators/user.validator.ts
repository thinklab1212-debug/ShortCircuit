// ============================================================================
// ElectroKart — User Validators
// ============================================================================
// Defines input validation schemas for user operations: updating profiles and
// managing roles administratively.
// ============================================================================

import { z } from 'zod';
import { USER_ROLES } from '../interfaces/auth.interface.js';

/**
 * Schema for updating user profile info.
 * All fields are optional but must be validated if provided.
 */
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .optional(),
    
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name must be at least 1 character')
    .max(50, 'Last name must not exceed 50 characters')
    .optional(),
    
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Invalid phone number. Must be a valid 10-digit Indian mobile number.')
    .optional(),
});

/**
 * Schema for updating a user's role (Admin only).
 */
export const changeRoleSchema = z.object({
  role: z.enum(USER_ROLES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid role. Must be either customer or admin.' }),
  }),
});

export default {
  updateProfileSchema,
  changeRoleSchema,
};
