// ============================================================================
// ElectroKart — JWT Token Generator
// ============================================================================
// Generates JWT access tokens (short-lived, in-memory) and refresh tokens
// (long-lived, stored as hashed value in MongoDB). Implements token rotation:
// each refresh issues a new pair and invalidates the old refresh token.
//
// Token Strategy:
//   Access Token  → 15 min, stored in client memory (Zustand), sent via
//                   Authorization: Bearer header
//   Refresh Token → 7 days, stored in httpOnly secure cookie, hashed in DB
//
// Usage:
//   const { accessToken, refreshToken } = await generateTokens(user, req);
// ============================================================================

import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import Token from '../models/Token.model.js';
import type { IUser } from '../models/User.model.js';
import type { Request } from 'express';

// ---------------------------------------------------------------------------
// Token payload interface
// ---------------------------------------------------------------------------

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;    // Unique identifier for this refresh token
}

// ---------------------------------------------------------------------------
// Token generation result
// ---------------------------------------------------------------------------

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ---------------------------------------------------------------------------
// Generate Access Token
// ---------------------------------------------------------------------------

/**
 * Creates a short-lived JWT access token containing user identity and role.
 *
 * @param user - The authenticated user document
 * @returns Signed JWT access token string
 */
export function generateAccessToken(user: IUser): string {
  const payload: AccessTokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
    issuer: 'electrokart',
    subject: user._id.toString(),
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

// ---------------------------------------------------------------------------
// Generate Refresh Token
// ---------------------------------------------------------------------------

/**
 * Creates a long-lived refresh token, hashes it, and stores the hash in
 * the database. The raw token is returned to be set as an httpOnly cookie.
 *
 * @param user - The authenticated user document
 * @param req  - Express request (for userAgent and IP tracking)
 * @returns Raw (unhashed) refresh token string
 */
export async function generateRefreshToken(user: IUser, req: Request): Promise<string> {
  // Generate a cryptographically random token
  const rawToken = crypto.randomBytes(40).toString('hex');

  // Hash the token before storing in database
  const hashedToken = await bcrypt.hash(rawToken, 10);

  // Calculate expiry date (parse the env variable like "7d")
  const expiresAt = calculateExpiry(env.JWT_REFRESH_EXPIRY);

  // Store hashed token in database
  await Token.create({
    userId: user._id,
    token: hashedToken,
    userAgent: req.headers['user-agent'] || 'unknown',
    ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
    expiresAt,
  });

  return rawToken;
}

// ---------------------------------------------------------------------------
// Generate Token Pair (Access + Refresh)
// ---------------------------------------------------------------------------

/**
 * Generates both an access token and a refresh token in one call.
 * This is the primary function used during login and token refresh.
 *
 * @param user - The authenticated user document
 * @param req  - Express request
 * @returns Object containing accessToken and refreshToken
 */
export async function generateTokenPair(user: IUser, req: Request): Promise<TokenPair> {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user, req);

  return { accessToken, refreshToken };
}

// ---------------------------------------------------------------------------
// Verify Refresh Token
// ---------------------------------------------------------------------------

/**
 * Finds and verifies a refresh token against the database.
 * Returns the matching token document or null if invalid/expired.
 *
 * @param userId   - The user's ObjectId as string
 * @param rawToken - The raw (unhashed) refresh token from the cookie
 * @returns The token document if valid, null otherwise
 */
export async function verifyRefreshToken(
  userId: string,
  rawToken: string
): Promise<InstanceType<typeof Token> | null> {
  // Find all non-expired tokens for this user
  const userTokens = await Token.find({
    userId,
    expiresAt: { $gt: new Date() },
  });

  // Compare raw token against each stored hash
  for (const tokenDoc of userTokens) {
    const isMatch = await bcrypt.compare(rawToken, tokenDoc.token);
    if (isMatch) {
      return tokenDoc;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Revoke Refresh Token
// ---------------------------------------------------------------------------

/**
 * Deletes a specific refresh token from the database (e.g., on logout).
 *
 * @param tokenId - The MongoDB _id of the token document
 */
export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await Token.findByIdAndDelete(tokenId);
}

/**
 * Revokes ALL refresh tokens for a user (e.g., on password change).
 * Forces re-login on all devices.
 *
 * @param userId - The user's ObjectId as string
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await Token.deleteMany({ userId });
}

// ---------------------------------------------------------------------------
// Cookie Options
// ---------------------------------------------------------------------------

/**
 * Returns cookie options for setting the refresh token as an httpOnly cookie.
 */
export function getRefreshTokenCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
} {
  return {
    httpOnly: true,                          // Not accessible via JavaScript
    secure: env.IS_PRODUCTION,               // HTTPS only in production
    sameSite: env.IS_PRODUCTION ? 'strict' : 'lax',
    maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRY), // Match token expiry
    path: '/api/v1/auth',                    // Only sent to auth endpoints
  };
}

// ---------------------------------------------------------------------------
// Utility: Parse duration string to milliseconds
// ---------------------------------------------------------------------------

/**
 * Parses a duration string like "15m", "7d", "1h" to milliseconds.
 */
function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}. Expected format: 15m, 7d, 1h, etc.`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

/**
 * Calculates an expiry Date from a duration string.
 */
function calculateExpiry(duration: string): Date {
  return new Date(Date.now() + parseDurationToMs(duration));
}

// ---------------------------------------------------------------------------
// Decode Access Token (without full verification — used for refresh flow)
// ---------------------------------------------------------------------------

/**
 * Decodes an access token payload without verifying expiry.
 * Used in the refresh flow to extract the userId from an expired token.
 *
 * @param token - The expired access token
 * @returns Decoded payload or null if malformed
 */
export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.decode(token) as AccessTokenPayload | null;
    return decoded;
  } catch {
    return null;
  }
}
