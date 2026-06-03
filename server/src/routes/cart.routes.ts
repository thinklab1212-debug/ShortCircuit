// ============================================================================
// ElectroKart — Cart Routes
// ============================================================================
// Defines paths for managing the shopping cart (items CRUD and pricing totals).
// ============================================================================

import { Router } from 'express';
import { CartController } from '../controllers/index.js';
import { authenticate, validate } from '../middlewares/index.js';
import { addToCartSchema, updateCartItemSchema, objectIdSchema } from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// All cart endpoints require authentication
router.use(authenticate);

/**
 * @openapi
 * /cart:
 *   get:
 *     summary: Retrieve user shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shopping cart retrieved successfully
 */
router.get('/', CartController.getCart);

/**
 * @openapi
 * /cart/items:
 *   post:
 *     summary: Add product/variant to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               variant:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   value:
 *                     type: string
 *     responses:
 *       200:
 *         description: Item added/updated in cart
 */
router.post('/items', validate({ body: addToCartSchema }), CartController.addToCart);

/**
 * @openapi
 * /cart/items/{itemId}:
 *   patch:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cart item quantity updated
 */
router.patch('/items/:itemId', validate({ params: z.object({ itemId: objectIdSchema }), body: updateCartItemSchema }), CartController.updateCartItem);

/**
 * @openapi
 * /cart/items/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from cart
 */
router.delete('/items/:itemId', validate({ params: z.object({ itemId: objectIdSchema }) }), CartController.removeFromCart);

/**
 * @openapi
 * /cart:
 *   delete:
 *     summary: Clear shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.delete('/', CartController.clearCart);

/**
 * @openapi
 * /cart/totals:
 *   get:
 *     summary: Calculate pricing totals including shipping, GST, and coupon discounts
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: couponCode
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Totals calculated successfully
 */
router.get('/totals', validate({ query: z.object({ couponCode: z.string().optional() }) }), CartController.getCartTotals);

export default router;
