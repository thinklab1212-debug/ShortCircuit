// ============================================================================
// ElectroKart — Authentication Middleware
// ============================================================================
// Intercepts requests, validates JWT Bearer tokens from the Authorization header,
// fetches the user from the database to check status (deleted/blocked),
// and injects user profile metadata into the request context.
// ============================================================================

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError, asyncHandler } from '../utils/index.js';
import { User } from '../models/index.js';
import { AUTH_CONSTANTS, IAccessTokenPayload } from '../interfaces/auth.interface.js';
import { Request } from 'express';

// Extend Express Request locally to allow req.user assignments inside the file
interface AuthenticatedRequest extends Request {
  user?: Express.AuthenticatedUser;
}

export const authenticate = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  // 1. Extract token from Authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  
  if (
    typeof authHeader === 'string' &&
    authHeader.startsWith(AUTH_CONSTANTS.TOKEN_PREFIX)
  ) {
    token = authHeader.split(' ')[1];
  }
  // Fallback: check cookie if available
  else if (req.cookies) {
    token = req.cookies[AUTH_CONSTANTS.ACCESS_TOKEN_COOKIE] || req.cookies.accessToken;
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication credentials were not provided');
  }

  try {
    // 2. Verify Access Token
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as IAccessTokenPayload;

    // 3. Retrieve user from database to ensure they still exist and are active
    const userDoc = await User.findById(decoded.userId).select('+isBlocked');

    if (!userDoc) {
      throw ApiError.unauthorized('The user belonging to this token no longer exists');
    }

    // 4. Enforce block-status checks
    if (userDoc.isBlocked) {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.');
    }

    // 5. Inject authenticated user metadata into request context
    req.user = {
      _id: userDoc._id.toString(),
      email: userDoc.email,
      role: userDoc.role,
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      isBlocked: userDoc.isBlocked,
      isEmailVerified: userDoc.isEmailVerified,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Access token expired. Please refresh your token.');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid authentication token');
    }
    throw error;
  }
});

export default authenticate;
