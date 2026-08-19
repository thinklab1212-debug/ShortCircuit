// ============================================================================
// ElectroKart — Variant Routes
// ============================================================================
// Defines HTTP paths for public parametric search, product variant queries,
// and administrative CRUD management (single and pre-validated batch imports).
// ============================================================================

import { Router } from 'express';
import { VariantController } from '../controllers/index.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import {
  objectIdSchema,
  createVariantSchema,
  batchCreateVariantSchema,
  updateVariantSchema,
  variantFilterSchema,
} from '../validators/index.js';
import { z } from 'zod';

const router = Router();

// Public Parametric Search endpoint across linked component variants
router.get('/parametric-search', VariantController.parametricSearch);

// Public Variants Query endpoint for a parent Product Family
router.get(
  '/products/:productId',
  validate({
    params: z.object({ productId: objectIdSchema }),
    query: variantFilterSchema,
  }),
  VariantController.getVariantsByProductId
);

// ---------------------------------------------------------------------------
// Admin-Only Management Endpoints
// Pipeline: authenticate -> authorize('admin') -> validate -> controller -> service
// ---------------------------------------------------------------------------

router.use(authenticate, authorize('admin'));

// Admin Create Single Variant
router.post(
  '/products/:productId',
  validate({
    params: z.object({ productId: objectIdSchema }),
    body: createVariantSchema,
  }),
  VariantController.createVariant
);

// Admin Batch Create Variants (supports dryRun query flag)
router.post(
  '/products/:productId/batch',
  validate({
    params: z.object({ productId: objectIdSchema }),
    body: batchCreateVariantSchema,
  }),
  VariantController.batchCreateVariants
);

// Admin Edit Variant Details
router.patch(
  '/:variantId',
  validate({
    params: z.object({ variantId: objectIdSchema }),
    body: updateVariantSchema,
  }),
  VariantController.updateVariant
);

// Admin Deactivate / Delete Variant
router.delete(
  '/:variantId',
  validate({
    params: z.object({ variantId: objectIdSchema }),
  }),
  VariantController.deleteVariant
);

export default router;
