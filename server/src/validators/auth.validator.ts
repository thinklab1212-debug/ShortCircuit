// ============================================================================
// ElectroKart — Authentication Validators
// ============================================================================
// Defines input validation schemas for authentication endpoints: registration,
// login, forgot password, reset password, and change password.
// ============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared Password Schema Rule
// ---------------------------------------------------------------------------

/**
 * Enforces strong passwords:
 *  - Minimum 8 characters, maximum 100 characters
 *  - At least one uppercase letter
 *  - At least one lowercase letter
 *  - At least one digit
 *  - At least one special character (@$!%*?& etc.)
 */
const passwordRule = z
  .string({
    required_error: 'Password is required',
  })
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password must not exceed 100 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for registering a new user.
 */
export const registerSchema = z
  .object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .trim()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters'),
      
    lastName: z
      .string({ required_error: 'Last name is required' })
      .trim()
      .min(1, 'Last name must be at least 1 character')
      .max(50, 'Last name must not exceed 50 characters'),
      
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Invalid email address format'),
      
    phone: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, 'Invalid phone number. Must be a valid 10-digit Indian mobile number.')
      .optional(),
      
    password: passwordRule,
    confirmPassword: z.string({ required_error: 'Confirm password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Schema for user login.
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
    
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

/**
 * Schema for forgot-password triggers.
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
});

/**
 * Schema for resetting password with verification tokens.
 */
export const resetPasswordSchema = z
  .object({
    password: passwordRule,
    confirmPassword: z.string({ required_error: 'Confirm password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Schema for modifying password inside an active session.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password cannot be empty'),
      
    newPassword: passwordRule,
    confirmNewPassword: z.string({ required_error: 'Confirm new password is required' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export default {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
