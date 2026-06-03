// ============================================================================
// ElectroKart — User Routes
// ============================================================================
// Defines paths for user profile views, editing, avatar uploads, and admin management.
// ============================================================================

import { Router } from 'express';
import { UserController } from '../controllers/index.js';
import { authenticate, authorize, validate, uploadImages } from '../middlewares/index.js';
import {
  updateProfileSchema,
  changeRoleSchema,
  objectIdSchema,
  paginationQuerySchema,
} from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Retrieve own profile details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/me', UserController.getProfile);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     summary: Edit profile details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch('/me', validate({ body: updateProfileSchema }), UserController.updateProfile);

/**
 * @openapi
 * /users/me/avatar:
 *   patch:
 *     summary: Upload profile avatar image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 */
router.patch('/me/avatar', uploadImages.single('avatar'), UserController.updateAvatar);

// Admin-only user management routes
router.use(authorize('admin'));

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Users listed successfully
 */
router.get('/', validate({ query: paginationQuerySchema }), UserController.getAllUsers);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get single user details (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 */
router.get('/:id', validate({ params: z.object({ id: objectIdSchema }) }), UserController.getUserById);

/**
 * @openapi
 * /users/{id}/block:
 *   patch:
 *     summary: Toggle blocking/unblocking a user account (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User account status changed
 */
router.patch('/:id/block', validate({ params: z.object({ id: objectIdSchema }) }), UserController.toggleBlockUser);

/**
 * @openapi
 * /users/{id}/role:
 *   patch:
 *     summary: Change user role (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, customer]
 *     responses:
 *       200:
 *         description: User role updated
 */
router.patch('/:id/role', validate({ params: z.object({ id: objectIdSchema }), body: changeRoleSchema }), UserController.changeUserRole);

export default router;
