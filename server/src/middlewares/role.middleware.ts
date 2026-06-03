// ============================================================================
// ElectroKart — Role Authorization Middleware
// ============================================================================
// Enforces Role-Based Access Control (RBAC). Restricts routes to specific
// user roles (e.g., 'admin' only, or 'customer'/'admin').
// ============================================================================

import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/index.js';
import { UserRole } from '../interfaces/auth.interface.js';
import { Request } from 'express';

/**
 * Restricts access to routes based on user role.
 * Assumes `authenticate` middleware has already run and attached `req.user`.
 *
 * @param allowedRoles - Roles allowed to access the route
 *
 * @example
 *   // Only admin users can access
 *   router.post('/products', authenticate, authorize('admin'), createProduct);
 *
 *   // Both customers and admins can access
 *   router.get('/orders', authenticate, authorize('customer', 'admin'), getOrders);
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Verify user context is present
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication credentials are required'));
    }

    // 2. Assert role requirements
    const hasRole = allowedRoles.includes(req.user.role);

    if (!hasRole) {
      return next(
        new ApiError(
          403,
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    // 3. Authorized — proceed
    next();
  };
}

export default authorize;
