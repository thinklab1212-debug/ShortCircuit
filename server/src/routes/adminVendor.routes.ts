// ============================================================================
// ElectroKart — Admin Vendor Management Routes
// ============================================================================
// Routes for admin to manage vendors and review vendor products.
// All routes require authentication + admin role.
// ============================================================================

import { Router } from 'express';
import { VendorController } from '../controllers/index.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import {
  createVendorSchema,
  reviewProductSchema,
  objectIdSchema,
  paginationQuerySchema,
} from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// All admin vendor routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// ─── Vendor Management ──────────────────────────────────────────────────────

router.get('/', validate({ query: paginationQuerySchema }), VendorController.getVendors);

router.post('/', validate({ body: createVendorSchema }), VendorController.createVendor);

router.get(
  '/:id',
  validate({ params: z.object({ id: objectIdSchema }) }),
  VendorController.getVendorById
);

router.post(
  '/:id/reset-password',
  validate({ params: z.object({ id: objectIdSchema }) }),
  VendorController.resetVendorPassword
);

// ─── Product Review Queue ────────────────────────────────────────────────────

router.get('/products/review-queue', VendorController.getReviewQueue);

router.patch(
  '/products/:id/review',
  validate({ params: z.object({ id: objectIdSchema }), body: reviewProductSchema }),
  VendorController.reviewProduct
);

export default router;
