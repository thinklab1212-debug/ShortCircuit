// ============================================================================
// ElectroKart — Brand Routes
// ============================================================================
// Defines paths for active brands, brand profiles, and admin brand management.
// ============================================================================

import { Router } from 'express';
import { BrandController } from '../controllers/index.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import { createBrandSchema, updateBrandSchema, objectIdSchema } from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// Public routes
/**
 * @openapi
 * /brands:
 *   get:
 *     summary: Retrieve active brands catalog
 *     tags: [Brands]
 *     responses:
 *       200:
 *         description: Active brands listed successfully
 */
router.get('/', BrandController.getBrands);

/**
 * @openapi
 * /brands/{slug}:
 *   get:
 *     summary: Retrieve brand details by URL slug
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Brand details retrieved successfully
 */
router.get('/:slug', BrandController.getBrandBySlug);

// Admin-only brand management endpoints
router.use(authenticate, authorize('admin'));

/**
 * @openapi
 * /brands/admin/all:
 *   get:
 *     summary: Retrieve all brands including inactive items (Admin only)
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All brands listed
 */
router.get('/admin/all', BrandController.getAdminBrands);

/**
 * @openapi
 * /brands:
 *   post:
 *     summary: Create a new brand (Admin only)
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               logo:
 *                 type: string
 *               website:
 *                 type: string
 *     responses:
 *       201:
 *         description: Brand created successfully
 */
router.post('/', validate({ body: createBrandSchema }), BrandController.createBrand);

/**
 * @openapi
 * /brands/{id}:
 *   patch:
 *     summary: Edit brand details (Admin only)
 *     tags: [Brands]
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
 *         description: Brand details updated successfully
 */
router.patch('/:id', validate({ params: z.object({ id: objectIdSchema }), body: updateBrandSchema }), BrandController.updateBrand);

/**
 * @openapi
 * /brands/{id}:
 *   delete:
 *     summary: Delete a brand (Admin only)
 *     tags: [Brands]
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
 *         description: Brand deleted successfully
 */
router.delete('/:id', validate({ params: z.object({ id: objectIdSchema }) }), BrandController.deleteBrand);

export default router;
