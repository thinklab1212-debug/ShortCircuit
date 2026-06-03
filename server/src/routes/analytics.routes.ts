// ============================================================================
// ElectroKart — Analytics Routes
// ============================================================================
// Defines paths for administrative reports (revenue, orders distribution, etc.).
// ============================================================================

import { Router } from 'express';
import { AnalyticsController } from '../controllers/index.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import { z } from 'zod';

const router = Router();

// All analytics endpoints require authentication and admin role privileges
router.use(authenticate, authorize('admin'));

/**
 * @openapi
 * /analytics/dashboard:
 *   get:
 *     summary: Retrieve admin dashboard summary stats card values
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 */
router.get('/dashboard', AnalyticsController.getDashboardStats);

/**
 * @openapi
 * /analytics/revenue:
 *   get:
 *     summary: Retrieve revenue monthly totals (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue trends data retrieved successfully
 */
router.get('/revenue', AnalyticsController.getRevenueData);

/**
 * @openapi
 * /analytics/orders:
 *   get:
 *     summary: Retrieve orders summary and status distributions (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders statistics retrieved successfully
 */
router.get('/orders', AnalyticsController.getOrderStats);

/**
 * @openapi
 * /analytics/top-products:
 *   get:
 *     summary: Retrieve top-selling products by quantity sold (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Top products retrieved successfully
 */
router.get('/top-products', validate({ query: z.object({ limit: z.string().optional() }) }), AnalyticsController.getTopProducts);

/**
 * @openapi
 * /analytics/top-categories:
 *   get:
 *     summary: Retrieve breakdown of revenue/counts by category (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top categories retrieved successfully
 */
router.get('/top-categories', AnalyticsController.getTopCategories);

export default router;
