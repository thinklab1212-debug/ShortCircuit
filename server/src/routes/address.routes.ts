// ============================================================================
// ElectroKart — Address Routes
// ============================================================================
// Defines paths for user address management (CRUD and defaults).
// ============================================================================

import { Router } from 'express';
import { AddressController } from '../controllers/index.js';
import { authenticate, validate } from '../middlewares/index.js';
import { createAddressSchema, updateAddressSchema, objectIdSchema } from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// All address endpoints require authentication
router.use(authenticate);

/**
 * @openapi
 * /addresses:
 *   get:
 *     summary: Retrieve user addresses list
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 */
router.get('/', AddressController.getAddresses);

/**
 * @openapi
 * /addresses:
 *   post:
 *     summary: Add a new address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, phone, addressLine1, city, state, pincode]
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *               landmark:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address created successfully
 */
router.post('/', validate({ body: createAddressSchema }), AddressController.createAddress);

/**
 * @openapi
 * /addresses/{id}:
 *   patch:
 *     summary: Update an address
 *     tags: [Addresses]
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
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *               landmark:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 */
router.patch('/:id', validate({ params: z.object({ id: objectIdSchema }), body: updateAddressSchema }), AddressController.updateAddress);

/**
 * @openapi
 * /addresses/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Addresses]
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
 *         description: Address deleted successfully
 */
router.delete('/:id', validate({ params: z.object({ id: objectIdSchema }) }), AddressController.deleteAddress);

/**
 * @openapi
 * /addresses/{id}/default:
 *   patch:
 *     summary: Set default shipping address
 *     tags: [Addresses]
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
 *         description: Default address set successfully
 */
router.patch('/:id/default', validate({ params: z.object({ id: objectIdSchema }) }), AddressController.setDefaultAddress);

export default router;
