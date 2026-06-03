// ============================================================================
// ElectroKart — Coupon Routes
// ============================================================================
// Defines paths for validation and administrative coupon CRUD.
// ============================================================================

import { Router } from 'express';
import { CouponController } from '../controllers/index.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  objectIdSchema,
  paginationQuerySchema,
} from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// All coupon endpoints require authentication
router.use(authenticate);

/**
 * @openapi
 * /coupons/validate:
 *   post:
 *     summary: Validate and calculate coupon discount (User only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, cartTotal, cartCategoryIds]
 *             properties:
 *               code:
 *                 type: string
 *               cartTotal:
 *                 type: number
 *               cartCategoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Coupon validated successfully
 */
router.post('/validate', validate({ body: validateCouponSchema }), CouponController.validateCoupon);

// Admin-only coupon management endpoints
router.use(authorize('admin'));

/**
 * @openapi
 * /coupons/admin:
 *   get:
 *     summary: List all coupons (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupons listed successfully
 */
router.get('/admin', validate({ query: paginationQuerySchema }), CouponController.getAllCoupons);

/**
 * @openapi
 * /coupons/admin:
 *   post:
 *     summary: Create a new coupon (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, discountType, discountValue]
 *             properties:
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *     responses:
 *       201:
 *         description: Coupon created successfully
 */
router.post('/admin', validate({ body: createCouponSchema }), CouponController.createCoupon);

/**
 * @openapi
 * /coupons/admin/{id}:
 *   patch:
 *     summary: Edit coupon details (Admin only)
 *     tags: [Coupons]
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
 *         description: Coupon details updated successfully
 */
router.patch('/admin/:id', validate({ params: z.object({ id: objectIdSchema }), body: updateCouponSchema }), CouponController.updateCoupon);

/**
 * @openapi
 * /coupons/admin/{id}:
 *   delete:
 *     summary: Delete a coupon (Admin only)
 *     tags: [Coupons]
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
 *         description: Coupon deleted successfully
 */
router.delete('/admin/:id', validate({ params: z.object({ id: objectIdSchema }) }), CouponController.deleteCoupon);

export default router;
