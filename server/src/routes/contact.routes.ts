// ============================================================================
// ElectroKart — Contact Routes
// ============================================================================
// Defines public API endpoints for receiving contact form submissions.
// ============================================================================

import { Router } from 'express';
import { ContactController } from '../controllers/index.js';
import { validate } from '../middlewares/index.js';
import { sendContactEmailSchema } from '../validators/index.js';

const router = Router();

/**
 * @openapi
 * /contact:
 *   post:
 *     summary: Send a contact form email inquiry (Public)
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, subject, message]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 */
router.post('/', validate({ body: sendContactEmailSchema }), ContactController.sendContactEmail);

export default router;
