// ============================================================================
// ElectroKart — Authentication Routes
// ============================================================================
// Defines routes for registration, login, logout, password resets, and changes.
// ============================================================================

import { Router } from 'express';
import { AuthController } from '../controllers/index.js';
import { validate, authLimiter, authenticate } from '../middlewares/index.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/index.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, confirmPassword]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', authLimiter, validate({ body: registerSchema }), AuthController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authLimiter, validate({ body: loginSchema }), AuthController.login);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout user and invalidate refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     summary: Rotate access and refresh tokens
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Tokens rotated successfully
 */
router.post('/refresh-token', AuthController.refreshToken);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Trigger forgot password flow (email reset link)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), AuthController.forgotPassword);

/**
 * @openapi
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password using verification token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, confirmPassword]
 *             properties:
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password/:token', authLimiter, validate({ body: resetPasswordSchema }), AuthController.resetPassword);

/**
 * @openapi
 * /auth/change-password:
 *   patch:
 *     summary: Change user password in active session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, confirmNewPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmNewPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.patch('/change-password', authenticate, validate({ body: changePasswordSchema }), AuthController.changePassword);

export default router;
