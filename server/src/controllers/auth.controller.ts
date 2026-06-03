// ============================================================================
// ElectroKart — Authentication Controller
// ============================================================================
// Processes incoming requests for account registration, login sessions, token
// refresh cycles, logouts, and password flows, mapping results to ApiResponses.
// ============================================================================

import { Request, Response } from 'express';
import { AuthService } from '../services/index.js';
import { ApiResponse, asyncHandler, ApiError } from '../utils/index.js';
import { getRefreshTokenCookieOptions } from '../utils/generateTokens.js';
import { AUTH_CONSTANTS } from '../interfaces/auth.interface.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.register(req.body);
  
  res.status(201).json(
    new ApiResponse(201, {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    }, 'Account registered successfully. Welcome email sent.')
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const ipCtx = {
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  };

  const { user, accessToken, refreshToken } = await AuthService.login(req.body, ipCtx);

  // Set the refresh token as a secure httpOnly cookie
  res.cookie(
    AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE,
    refreshToken,
    getRefreshTokenCookieOptions()
  );

  res.status(200).json(
    new ApiResponse(200, { user, accessToken }, 'Login successful.')
  );
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies[AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE];
  const userId = req.user?._id;

  if (rawRefreshToken && userId) {
    await AuthService.logout(rawRefreshToken, userId);
  }

  // Clear cookie
  res.clearCookie(AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    path: '/api/v1/auth',
  });

  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const expiredAccessToken = req.headers.authorization?.split(' ')[1] || req.cookies.accessToken;
  const rawRefreshToken = req.cookies[AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE];

  if (!expiredAccessToken) {
    throw ApiError.unauthorized('Access token is missing.');
  }

  if (!rawRefreshToken) {
    throw ApiError.unauthorized('Session has expired. Please login again.');
  }

  const ipCtx = {
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  };

  const tokens = await AuthService.rotateTokens(expiredAccessToken, rawRefreshToken, ipCtx);

  // Set the new refresh token cookie
  res.cookie(
    AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    getRefreshTokenCookieOptions()
  );

  res.status(200).json(
    new ApiResponse(200, { accessToken: tokens.accessToken }, 'Token refreshed successfully.')
  );
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.forgotPassword(req.body.email);
  
  res.status(200).json(
    new ApiResponse(200, null, 'If this email exists, instructions to reset your password have been sent.')
  );
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    throw ApiError.badRequest('Reset token is required.');
  }

  await AuthService.resetPassword(token, password);

  res.status(200).json(new ApiResponse(200, null, 'Password reset successful. Please login with your new credentials.'));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const { currentPassword, newPassword } = req.body;

  await AuthService.changePassword(userId, currentPassword, newPassword);

  res.status(200).json(new ApiResponse(200, null, 'Password updated successfully.'));
});
