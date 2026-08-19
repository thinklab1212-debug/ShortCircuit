// ============================================================================
// ElectroKart — Maintenance Mode Middleware
// ============================================================================
// Intercepts requests when global maintenance mode is enabled.
// Whitelists health endpoints, public settings, auth login, and admin users.
// Returns HTTP 503 Service Unavailable for non-whitelisted public requests.
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import SystemSettings from '../models/SystemSettings.model.js';
import User from '../models/User.model.js';
import { env } from '../config/env.js';
import { AUTH_CONSTANTS, IAccessTokenPayload } from '../interfaces/auth.interface.js';
import { ApiResponse } from '../utils/index.js';

// Exact or prefix paths that bypass maintenance mode
const WHITELISTED_PATHS = [
  '/health',
  '/health/live',
  '/health/ready',
  '/api/v1/health',
  '/api/v1/settings/public',
  '/api/v1/auth/login',
  '/api/v1/auth/me',
  '/api/v1/auth/logout',
  '/api/v1/auth/refresh-token',
];

/**
 * Helper to inspect authorization token without blocking if missing or expired
 */
async function checkIsAdminUser(req: Request): Promise<boolean> {
  // If req.user is already injected by prior auth middleware
  if (req.user && req.user.role === 'admin') {
    return true;
  }

  let token: string | undefined;
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (typeof authHeader === 'string' && authHeader.startsWith(AUTH_CONSTANTS.TOKEN_PREFIX)) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies) {
    token = req.cookies[AUTH_CONSTANTS.ACCESS_TOKEN_COOKIE] || req.cookies.accessToken;
  }

  if (!token) return false;

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as IAccessTokenPayload;
    const userDoc = await User.findById(decoded.userId).select('role isBlocked');
    if (userDoc && !userDoc.isBlocked && userDoc.role === 'admin') {
      req.user = {
        _id: userDoc._id.toString(),
        email: userDoc.email,
        role: userDoc.role,
        isOrganizer: userDoc.isOrganizer,
        firstName: userDoc.firstName,
        lastName: userDoc.lastName,
        isBlocked: userDoc.isBlocked,
        isEmailVerified: userDoc.isEmailVerified,
      };
      return true;
    }
  } catch {
    // Token invalid or expired
  }

  return false;
}

export const maintenanceMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Check if route path is explicitly whitelisted
    const currentPath = req.path.toLowerCase();
    const isWhitelisted = WHITELISTED_PATHS.some(
      (path) => currentPath === path || currentPath.startsWith(path)
    );

    if (isWhitelisted) {
      return next();
    }

    // 2. Fetch current system settings
    const settings = await SystemSettings.getSettings();

    // 3. If maintenance mode is OFF, continue normal processing
    if (!settings.isMaintenanceMode) {
      return next();
    }

    // 4. If maintenance mode is ON, check if requesting user is Admin
    const isAdmin = await checkIsAdminUser(req);
    if (isAdmin) {
      return next();
    }

    // 5. Block non-admin visitor request with HTTP 503 Service Unavailable
    res.setHeader('Retry-After', '3600');
    return res.status(503).json(
      new ApiResponse(
        503,
        {
          isMaintenanceMode: true,
          title: settings.maintenanceTitle,
          message: settings.maintenanceMessage,
          eta: settings.maintenanceETA || '',
        },
        settings.maintenanceMessage || 'Store is currently under maintenance.'
      )
    );
  } catch (error) {
    // Fallback: pass to standard error handler if database error occurs
    next(error);
  }
};
