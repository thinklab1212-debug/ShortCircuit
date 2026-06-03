// ============================================================================
// ElectroKart — Banner Routes
// ============================================================================
// Defines paths for active marketing banners and admin configurations.
// ============================================================================

import { Router } from 'express';
import { BannerController } from '../controllers/index.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import {
  createBannerSchema,
  updateBannerSchema,
  objectIdSchema,
  paginationQuerySchema,
} from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// Public routes
/**
 * @openapi
 * /banners:
 *   get:
 *     summary: Retrieve active marketing banners list (Public)
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: Active banners fetched successfully
 */
router.get('/', BannerController.getActiveBanners);

// Admin-only management endpoints
router.use(authenticate, authorize('admin'));

/**
 * @openapi
 * /banners/admin:
 *   get:
 *     summary: List all marketing banners (Admin only)
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Banners listed successfully
 */
router.get('/admin', validate({ query: paginationQuerySchema }), BannerController.getAllBanners);

/**
 * @openapi
 * /banners/admin:
 *   post:
 *     summary: Create a promotional banner (Admin only)
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, image]
 *             properties:
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               image:
 *                 type: string
 *               link:
 *                 type: string
 *               position:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Banner created successfully
 */
router.post('/admin', validate({ body: createBannerSchema }), BannerController.createBanner);

/**
 * @openapi
 * /banners/admin/{id}:
 *   patch:
 *     summary: Edit promotional banner details (Admin only)
 *     tags: [Banners]
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
 *         description: Banner updated successfully
 */
router.patch('/admin/:id', validate({ params: z.object({ id: objectIdSchema }), body: updateBannerSchema }), BannerController.updateBanner);

/**
 * @openapi
 * /banners/admin/{id}:
 *   delete:
 *     summary: Delete a promotional banner (Admin only)
 *     tags: [Banners]
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
 *         description: Banner deleted successfully
 */
router.delete('/admin/:id', validate({ params: z.object({ id: objectIdSchema }) }), BannerController.deleteBanner);

export default router;
