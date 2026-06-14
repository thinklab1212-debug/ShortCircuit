// ============================================================================
// ElectroKart — Authentication Service
// ============================================================================
// Contains authorization and credential verification logic.
// Works independently of the HTTP/Express layer, throwing ApiErrors.
// ============================================================================

import crypto from 'crypto';
import User from '../models/User.model.js';
import Token from '../models/Token.model.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/index.js';
import { EmailService } from './email.service.js';
import {
  generateTokenPair,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  decodeAccessToken,
} from '../utils/generateTokens.js';

interface IIpContext {
  ip: string;
  userAgent: string;
}

export class AuthService {
  /**
   * Registers a new user.
   */
  public static async register(dto: any): Promise<InstanceType<typeof User>> {
    const email = dto.email.toLowerCase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists.');
    }

    // Create user (hashing is handled by User model pre-save hook)
    const user = await User.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email,
      password: dto.password,
      phone: dto.phone,
    });

    // Send Welcome Email (non-blocking)
    EmailService.sendWelcomeEmail(user.email, user.firstName);

    return user;
  }

  /**
   * Logs a user in, generates token pairs, and updates login timestamp.
   */
  public static async login(
    dto: any,
    ipCtx: IIpContext
  ): Promise<{ user: InstanceType<typeof User>; accessToken: string; refreshToken: string }> {
    const email = dto.email.toLowerCase();

    // Retrieve user and explicitly include password field (select: false in schema)
    const user = await User.findOne({ email }).select('+password +isBlocked');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password credentials.');
    }

    if (user.isBlocked) {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.');
    }

    // Verify password
    const isPasswordMatch = await user.comparePassword(dto.password);
    if (!isPasswordMatch) {
      throw ApiError.unauthorized('Invalid email or password credentials.');
    }

    // Generate tokens
    // We pass a mock request to comply with generateTokenPair signature without binding to Express
    const mockReq = { headers: { 'user-agent': ipCtx.userAgent }, ip: ipCtx.ip } as any;
    const tokens = await generateTokenPair(user, mockReq);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Strip password from returned object
    user.password = undefined as any;

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Rotates refresh tokens and issues a new access/refresh token pair.
   */
  public static async rotateTokens(
    expiredAccessToken: string,
    rawRefreshToken: string,
    ipCtx: IIpContext
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Decode access token without verifying expiry to extract user identity
    const decoded = decodeAccessToken(expiredAccessToken);
    if (!decoded || !decoded.userId) {
      throw ApiError.unauthorized('Invalid access token payload.');
    }

    // 2. Look up and verify refresh token hash in DB
    const tokenDoc = await verifyRefreshToken(decoded.userId, rawRefreshToken, ipCtx);
    if (!tokenDoc) {
      throw ApiError.unauthorized('Invalid or expired session. Please login again.');
    }

    // 3. Find target user
    const user = await User.findById(decoded.userId).select('+isBlocked');
    if (!user || user.isBlocked) {
      // Clean up sessions if blocked
      if (user?.isBlocked) {
        await Token.deleteMany({ userId: user._id });
      }
      throw ApiError.unauthorized('User session revoked.');
    }

    // 4. Invalidate old refresh token (token rotation strategy)
    tokenDoc.status = 'rotated';
    tokenDoc.rotatedAt = new Date();
    await tokenDoc.save();

    // 5. Generate new pair
    const mockReq = { headers: { 'user-agent': ipCtx.userAgent }, ip: ipCtx.ip } as any;
    const tokens = await generateTokenPair(user, mockReq);

    return tokens;
  }

  /**
   * Logs a user out by revoking their refresh token.
   */
  public static async logout(rawRefreshToken: string, userId: string): Promise<void> {
    const tokenDoc = await verifyRefreshToken(userId, rawRefreshToken);
    if (tokenDoc) {
      await revokeRefreshToken(tokenDoc._id.toString());
    }
  }

  /**
   * Triggers forgot password workflow, generating a reset token and sending instructions.
   */
  public static async forgotPassword(email: string): Promise<void> {
    const targetEmail = email.toLowerCase();
    const user = await User.findOne({ email: targetEmail });
    
    // For security, do not leak user existence. Return success even if email is unmapped.
    if (!user) {
      return;
    }

    // Generate random reset token
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token to save in DB
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(rawResetToken)
      .digest('hex');

    // Save hashed token and expiry (+1 hour) to user record
    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Prepare reset URL
    const resetUrl = `${env.CLIENT_URL}/reset-password/${rawResetToken}`;

    // Send Reset Email (non-blocking)
    EmailService.sendPasswordResetEmail(user.email, user.firstName, resetUrl);
  }

  /**
   * Resets password using verification token.
   */
  public static async resetPassword(rawToken: string, password: string): Promise<void> {
    // Hash the token to compare with DB
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // Find user with non-expired reset token
    const user = await User.findOne({
      passwordResetToken: hashedResetToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new ApiError(400, 'Password reset token is invalid or has expired.');
    }

    // Assign new password (hash handled by pre-save hook)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all existing sessions to force re-login on all devices
    await revokeAllUserTokens(user._id.toString());
  }

  /**
   * Modifies password inside an active session.
   */
  public static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    if (!isPasswordMatch) {
      throw ApiError.unauthorized('Incorrect current password.');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Revoke all other active sessions to force re-login on other devices
    await revokeAllUserTokens(userId);
  }
}

export default AuthService;
