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
import SecurityLog from '../models/SecurityLog.model.js';
import { ROLE_SESSION_CONFIG } from '../interfaces/auth.interface.js';
import type { IUser } from '../models/User.model.js';
import type { Request } from 'express';
import ApiError from './ApiError.js';

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

  const role = (user.role || 'customer') as 'customer' | 'vendor' | 'admin';
  const config = ROLE_SESSION_CONFIG[role] || ROLE_SESSION_CONFIG.customer;

  const options: SignOptions = {
    expiresIn: config.accessExpiry as any,
    issuer: 'shortcircuit',
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

  const role = (user.role || 'customer') as 'customer' | 'vendor' | 'admin';
  const config = ROLE_SESSION_CONFIG[role] || ROLE_SESSION_CONFIG.customer;

  // Calculate expiry date (parse the config like "30d" or "14d")
  const expiresAt = calculateExpiry(config.refreshExpiry);

  // Store hashed token in database
  await Token.create({
    userId: user._id,
    token: hashedToken,
    userAgent: req.headers['user-agent'] || 'unknown',
    ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
    expiresAt,
    status: 'active',
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
  rawToken: string,
  ipCtx?: { ip: string; userAgent: string }
): Promise<InstanceType<typeof Token> | null> {
  // Find all non-expired tokens for this user (both active and rotated)
  const userTokens = await Token.find({
    userId,
    expiresAt: { $gt: new Date() },
  });

  // Compare raw token against each stored hash
  for (const tokenDoc of userTokens) {
    const isMatch = await bcrypt.compare(rawToken, tokenDoc.token);
    if (isMatch) {
      if (tokenDoc.status === 'rotated') {
        const gracePeriodMs = 10000; // 10-second grace period for concurrent requests (multi-tab refreshes)
        const timeSinceRotation = Date.now() - (tokenDoc.rotatedAt?.getTime() || 0);

        if (timeSinceRotation < gracePeriodMs) {
          // Find the active token generated in this rotation cycle for this user.
          const activeToken = await Token.findOne({
            userId,
            status: 'active',
            createdAt: { $gte: tokenDoc.rotatedAt },
          });
          if (activeToken) {
            return activeToken;
          }
        }

        // Potential session hijacking detected!
        // 1. Revoke all active sessions for this user
        await Token.deleteMany({ userId });

        // 2. Log security event
        await SecurityLog.create({
          userId,
          eventType: 'refresh_token_reuse',
          ipAddress: ipCtx?.ip || 'unknown',
          userAgent: ipCtx?.userAgent || 'unknown',
        });

        // 3. Throw reuse / hijack error
        throw ApiError.unauthorized('Potential session hijacking detected. All sessions have been revoked. Please login again.');
      }
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
 * Returns cookie options for setting access and refresh tokens as cookies.
 */
export function getCookieOptions(
  role: 'customer' | 'vendor' | 'admin',
  type: 'access' | 'refresh'
): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
  domain?: string;
} {
  const config = ROLE_SESSION_CONFIG[role] || ROLE_SESSION_CONFIG.customer;
  // Always use the refresh token's expiry for the cookie maxAge so the expired access token cookie
  // isn't prematurely deleted by the browser before it can be used for token rotation.
  const expiry = config.refreshExpiry;
  const maxAge = parseDurationToMs(expiry);

  const options: any = {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: 'lax',
    maxAge,
    path: '/',
  };

  if (env.COOKIE_DOMAIN) {
    options.domain = env.COOKIE_DOMAIN;
  }

  return options;
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
