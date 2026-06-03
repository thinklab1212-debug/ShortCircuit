// ============================================================================
// ElectroKart — Vendor Self-Service Routes
// ============================================================================
// Routes accessible only to users with role='vendor'.
// Handles vendor profile, dashboard, and product management.
// ============================================================================

import { Router } from 'express';
import { VendorController } from '../controllers/index.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import {
  updateVendorProfileSchema,
  vendorCreateProductSchema,
  vendorUpdateProductSchema,
  objectIdSchema,
  paginationQuerySchema,
} from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// All vendor routes require authentication + vendor role
router.use(authenticate, authorize('vendor'));

// ─── Dashboard ───────────────────────────────────────────────────────────────

router.get('/dashboard', VendorController.getDashboard);

// ─── Profile ─────────────────────────────────────────────────────────────────

router.get('/profile', VendorController.getProfile);
router.put('/profile', validate({ body: updateVendorProfileSchema }), VendorController.updateProfile);

// ─── Products ────────────────────────────────────────────────────────────────

router.get('/products', VendorController.getVendorProducts);

router.post(
  '/products',
  validate({ body: vendorCreateProductSchema }),
  VendorController.createProduct
);

router.get(
  '/products/:id',
  validate({ params: z.object({ id: objectIdSchema }) }),
  VendorController.getVendorProduct
);

router.patch(
  '/products/:id',
  validate({ params: z.object({ id: objectIdSchema }), body: vendorUpdateProductSchema }),
  VendorController.updateProduct
);

router.delete(
  '/products/:id',
  validate({ params: z.object({ id: objectIdSchema }) }),
  VendorController.deleteProduct
);

router.patch(
  '/products/:id/submit',
  validate({ params: z.object({ id: objectIdSchema }) }),
  VendorController.submitForReview
);

export default router;
