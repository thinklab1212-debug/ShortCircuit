// ============================================================================
// Short Circuit — Organizer Authorization Middleware
// ============================================================================
// Enforces that the authenticated user has been approved as an Organizer.
// This checks the `isOrganizer` boolean flag on the user, NOT the role field.
//
// The user retains their original role (customer/vendor/admin) and gains
// organizer capabilities as an additive permission.
//
// Assumes `authenticate` middleware has already run and attached `req.user`.
//
// Usage:
//   router.post('/events', authenticate, requireOrganizer, createEvent);
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/index.js';

/**
 * Restricts access to routes that require approved Organizer status.
 * Must be used AFTER `authenticate` middleware.
 *
 * @example
 *   // Only approved organizers can access
 *   router.post('/organizer/events', authenticate, requireOrganizer, createEvent);
 */
export function requireOrganizer(req: Request, res: Response, next: NextFunction) {
  // 1. Verify user context is present
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication credentials are required'));
  }

  // 2. Assert organizer status
  if (!req.user.isOrganizer) {
    return next(
      new ApiError(
        403,
        'Forbidden: You must be an approved event organizer to access this resource'
      )
    );
  }

  // 3. Authorized — proceed
  next();
}

export default requireOrganizer;
