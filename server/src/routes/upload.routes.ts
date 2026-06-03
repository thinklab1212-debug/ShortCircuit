// ============================================================================
// ElectroKart — Upload Routes
// ============================================================================
// Defines paths for uploading assets to Cloudinary (Admin only).
// ============================================================================

import { Router } from 'express';
import { UploadController } from '../controllers/index.js';
import { authenticate, authorize, validate, uploadImages } from '../middlewares/index.js';
import { z } from 'zod';

const router = Router();

// Upload endpoints are restricted to administrators
router.use(authenticate, authorize('admin'));

/**
 * @openapi
 * /upload/image:
 *   post:
 *     summary: Upload a single image to Cloudinary (Admin only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
router.post('/image', uploadImages.single('image'), UploadController.uploadSingleImage);

/**
 * @openapi
 * /upload/images:
 *   post:
 *     summary: Batch upload up to 8 images to Cloudinary (Admin only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 */
router.post('/images', uploadImages.array('images', 15), UploadController.uploadMultipleImages);

/**
 * @openapi
 * /upload/{publicId}:
 *   delete:
 *     summary: Remove an image asset from Cloudinary (Admin only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 */
router.delete('/:publicId', validate({ params: z.object({ publicId: z.string({ required_error: 'Public ID is required' }).trim().min(1) }) }), UploadController.deleteImage);

export default router;
