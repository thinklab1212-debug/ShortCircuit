// ============================================================================
// ElectroKart — Category Routes
// ============================================================================
// Defines paths for public categories, trees, and administrative category CRUD.
// ============================================================================

import { Router } from 'express';
import { CategoryController } from '../controllers/index.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import { createCategorySchema, updateCategorySchema, objectIdSchema } from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// Public endpoints
/**
 * @openapi
 * /categories:
 *   get:
 *     summary: Retrieve flat list of categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Flat list of categories retrieved successfully
 */
router.get('/', CategoryController.getCategories);

/**
 * @openapi
 * /categories/tree:
 *   get:
 *     summary: Retrieve nested categories tree hierarchy
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories tree structure retrieved successfully
 */
router.get('/tree', CategoryController.getCategoryTree);

// Admin-only management endpoints
router.use(authenticate, authorize('admin'));

/**
 * @openapi
 * /categories:
 *   post:
 *     summary: Create a new category (Admin only)
 *     tags: [Categories]
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
 *               parentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/', validate({ body: createCategorySchema }), CategoryController.createCategory);

/**
 * @openapi
 * /categories/{id}:
 *   patch:
 *     summary: Update an existing category (Admin only)
 *     tags: [Categories]
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
 *         description: Category updated successfully
 */
router.patch('/:id', validate({ params: z.object({ id: objectIdSchema }), body: updateCategorySchema }), CategoryController.updateCategory);

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category (Admin only)
 *     tags: [Categories]
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
 *         description: Category deleted successfully
 */
router.delete('/:id', validate({ params: z.object({ id: objectIdSchema }) }), CategoryController.deleteCategory);

export default router;
