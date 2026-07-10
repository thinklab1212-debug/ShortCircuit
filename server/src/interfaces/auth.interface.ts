// ============================================================================
// ElectroKart — Authentication & Authorization Interfaces
// ============================================================================
// Type definitions for authentication flows: JWT payloads, login/register
// DTOs, token pairs, password reset, and role-based access control.
// ============================================================================

import type { Request } from 'express';

// ---------------------------------------------------------------------------
// User Roles
// ---------------------------------------------------------------------------

/**
 * All supported user roles in the system.
 * Used by the RBAC middleware to authorize route access.
 */
export type UserRole = 'customer' | 'vendor' | 'admin';

/**
 * Array of all valid roles — used in middleware for validation.
 */
export const USER_ROLES: readonly UserRole[] = ['customer', 'vendor', 'admin'] as const;

// ---------------------------------------------------------------------------
// JWT Token Payloads
// ---------------------------------------------------------------------------

/**
 * Claims embedded in the JWT access token.
 * Decoded by `auth.middleware.ts` and attached to `req.user`.
 */
export interface IAccessTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  iss?: string;
  sub?: string;
}

/**
 * Claims embedded in the refresh token (if using JWT-based refresh).
 * In our implementation, refresh tokens are opaque random strings,
 * but this interface is kept for future flexibility.
 */
export interface IRefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

// ---------------------------------------------------------------------------
// Auth Request DTOs (Data Transfer Objects)
// ---------------------------------------------------------------------------

/**
 * Register request body — validated by `auth.validator.ts`.
 */
export interface IRegisterDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

/**
 * Login request body.
 */
export interface ILoginDTO {
  email: string;
  password: string;
}

/**
 * Forgot password request body.
 */
export interface IForgotPasswordDTO {
  email: string;
}

/**
 * Reset password request body (with token from URL param).
 */
export interface IResetPasswordDTO {
  password: string;
  confirmPassword: string;
}

/**
 * Change password request body (authenticated user).
 */
export interface IChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// ---------------------------------------------------------------------------
// Auth Response Types
// ---------------------------------------------------------------------------

/**
 * Data returned after successful login or register.
 */
export interface IAuthResponse {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    isOrganizer: boolean;
    avatar?: {
      url: string;
      publicId: string;
    };
    isEmailVerified: boolean;
  };
  accessToken: string;
  // refreshToken is set as httpOnly cookie, not in response body
}

// ---------------------------------------------------------------------------
// Authenticated Request Type
// ---------------------------------------------------------------------------

/**
 * Express Request with guaranteed authenticated user.
 * Use this type in controllers that are behind auth middleware.
 *
 * @example
 *   const handler = asyncHandler(async (req: AuthenticatedRequest, res) => {
 *     const userId = req.user._id;  // TypeScript knows `user` exists
 *   });
 */
export interface AuthenticatedRequest extends Request {
  user: Express.AuthenticatedUser;
}

// ---------------------------------------------------------------------------
// RBAC Types
// ---------------------------------------------------------------------------

/**
 * Route-level role requirement.
 * Used by `role.middleware.ts` to check if the authenticated user
 * has the required role(s).
 *
 * @example
 *   // Single role
 *   authorize('admin')
 *   // Multiple roles (OR logic — any match grants access)
 *   authorize('admin', 'customer')
 */
export type RoleRequirement = UserRole | UserRole[];

/**
 * Token cookie name constants.
 */
export const AUTH_CONSTANTS = {
  ACCESS_TOKEN_COOKIE: 'accessToken',
  REFRESH_TOKEN_COOKIE: 'electrokart_refresh_token',
  ACCESS_TOKEN_HEADER: 'Authorization',
  TOKEN_PREFIX: 'Bearer ',
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
  MAX_LOGIN_ATTEMPTS: 10,
  LOCKOUT_DURATION_MINUTES: 15,
} as const;

export const ROLE_SESSION_CONFIG = {
  customer: {
    accessExpiry: '15m',
    refreshExpiry: '30d',
  },
  vendor: {
    accessExpiry: '15m',
    refreshExpiry: '14d',
  },
  admin: {
    accessExpiry: '10m',
    refreshExpiry: '7d',
  },
} as const;

