// ============================================================================
// ElectroKart — Product Routes
// ============================================================================
// Defines paths for public product catalogue queries, featured, autocomplete,
// and administrative CRUD management.
// ============================================================================

import { Router } from 'express';
import { ProductController } from '../controllers/index.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  searchQuerySchema,
  objectIdSchema,
  paginationQuerySchema,
} from '../validators/index.js';
import { z } from 'zod';
import reviewRoutes from './review.routes.js';

const router = Router();

// Nested review routes (handles /products/:productId/reviews)
router.use('/:productId/reviews', reviewRoutes);

// Public catalogue routes
/**
 * @openapi
 * /products:
 *   get:
 *     summary: Retrieve product catalogue with sorting, paging, and filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Products catalog fetched successfully
 */
router.get('/', validate({ query: productFilterSchema }), ProductController.getProducts);

/**
 * @openapi
 * /products/featured:
 *   get:
 *     summary: Get featured products list
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Featured products fetched successfully
 */
router.get('/featured', ProductController.getFeaturedProducts);

/**
 * @openapi
 * /products/search/suggestions:
 *   get:
 *     summary: Fetch search autocomplete queries suggestions
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Autocomplete suggestions fetched successfully
 */
router.get('/search/suggestions', validate({ query: searchQuerySchema }), ProductController.getSearchSuggestions);

/**
 * @openapi
 * /products/{slug}:
 *   get:
 *     summary: Retrieve single product details by URL slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
 */
router.get('/:slug', ProductController.getProductBySlug);

/**
 * @openapi
 * /products/{id}/related:
 *   get:
 *     summary: Retrieve related products list (same category)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Related products retrieved successfully
 */
router.get('/:id/related', validate({ params: z.object({ id: objectIdSchema }) }), ProductController.getRelatedProducts);

// Admin-only management endpoints
router.use(authenticate, authorize('admin'));

/**
 * @openapi
 * /products/admin/all:
 *   get:
 *     summary: Retrieve admin product catalog (includes inactive/disabled items)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin catalog fetched successfully
 */
router.get('/admin/all', validate({ query: paginationQuerySchema }), ProductController.getAdminProducts);

/**
 * @openapi
 * /products:
 *   post:
 *     summary: Create a new product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, sku, price, category, brand, stock]
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               price:
 *                 type: number
 *               salePrice:
 *                 type: number
 *               category:
 *                 type: string
 *               brand:
 *                 type: string
 *               stock:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/', validate({ body: createProductSchema }), ProductController.createProduct);

/**
 * @openapi
 * /products/{id}:
 *   patch:
 *     summary: Edit product details (Admin only)
 *     tags: [Products]
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
 *         description: Product updated successfully
 */
router.patch('/:id', validate({ params: z.object({ id: objectIdSchema }), body: updateProductSchema }), ProductController.updateProduct);

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     summary: Soft delete/deactivate a product (Admin only)
 *     tags: [Products]
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
 *         description: Product deactivated successfully
 */
router.delete('/:id', validate({ params: z.object({ id: objectIdSchema }) }), ProductController.deleteProduct);

export default router;
