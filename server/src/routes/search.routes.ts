// ============================================================================
// ElectroKart — Search Routes
// ============================================================================
// Defines paths for product search and query recommendations.
// ============================================================================

import { Router } from 'express';
import { ProductController } from '../controllers/index.js';
import { validate } from '../middlewares/index.js';
import { productFilterSchema, searchQuerySchema } from '../validators/index.js';

const router = Router();

/**
 * @openapi
 * /search:
 *   get:
 *     summary: Full-text search and catalogue filters
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results returned successfully
 */
router.get('/', validate({ query: productFilterSchema }), ProductController.getProducts);

/**
 * @openapi
 * /search/suggestions:
 *   get:
 *     summary: Fetch search autocomplete query recommendations
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Autocomplete query recommendations retrieved successfully
 */
router.get('/suggestions', validate({ query: searchQuerySchema }), ProductController.getSearchSuggestions);

export default router;
