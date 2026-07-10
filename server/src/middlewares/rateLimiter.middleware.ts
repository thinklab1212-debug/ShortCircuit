// ============================================================================
// ElectroKart — Rate Limiting Middleware
// ============================================================================
// Configures express-rate-limit presets to protect public, auth, and admin
// endpoints from denial-of-service (DoS) and brute force attacks.
// ============================================================================

import * as rateLimitImport from 'express-rate-limit';
import type { Options } from 'express-rate-limit';
import { ApiError } from '../utils/index.js';

// express-rate-limit ships as CommonJS; resolve its callable export across interop/version differences
const rateLimit: any = (rateLimitImport as any).default ?? rateLimitImport;

/**
 * Standard error response handler when limit is exceeded.
 * Forwards a standardized 429 Too Many Requests error to the error middleware.
 */
const rateLimitErrorHandler = (req: any, res: any, next: any, options: Options) => {
  next(new ApiError(429, options.message));
};

// ---------------------------------------------------------------------------
// Rate Limiter Presets
// ---------------------------------------------------------------------------

/**
 * Limiters for public storefront APIs (e.g., product catalog search, category views).
 * 100 requests per 1 minute window.
 */
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests from this IP. Please try again after a minute.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: rateLimitErrorHandler,
});

/**
 * Limiters for auth routes (e.g., login, register, password-reset).
 * Threshold: 10 attempts per 15 minutes window.
 *
 * Keyed per user (by email) rather than purely per IP, so users sharing a
 * NAT/proxy/VPN egress IP don't exhaust one another's budget. Only *failed*
 * attempts count (`skipSuccessfulRequests`), so a legitimate user logging in,
 * registering, or resetting their password is never throttled — the counter
 * exists solely to slow brute-force guessing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req: any) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    // Identify by email when available; otherwise fall back to the request IP.
    return email ? `auth:user:${email}` : `auth:ip:${req.ip}`;
  },
  message: 'Too many login or registration attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitErrorHandler,
});

/**
 * Limiters for admin routes (e.g., upload, seeders, dashboards).
 * Moderate limit: 30 requests per 1 minute window.
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Admin rate limit exceeded. Please wait a minute before making further requests.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitErrorHandler,
});

/**
 * Limiters for team verification endpoints.
 * Keyed by request IP, 15 attempts per 15 minutes.
 */
export const teamVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: 'Too many team verification attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitErrorHandler,
});
