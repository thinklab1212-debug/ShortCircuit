// ============================================================================
// ShortCircuit — Bulk Order Routes
// ============================================================================
// Public submission route for bulk quotation inquiries, and protected admin routes.
// ============================================================================

import { Router } from 'express';
import { BulkOrderController } from '../controllers/index.js';
import { authenticate, optionalAuthenticate, authorize, validate } from '../middlewares/index.js';
import {
  createBulkOrderSchema,
  updateBulkOrderStatusSchema,
  bulkOrderIdParamSchema,
} from '../validators/index.js';

const router = Router();

// ─── Public & Customer Endpoints ──────────────────────────────────────────────
router.post(
  '/',
  optionalAuthenticate,
  validate({ body: createBulkOrderSchema }),
  BulkOrderController.createQuoteRequest
);

// Protected: fetch quotes for logged-in user
router.get('/my-orders', authenticate, BulkOrderController.getMyBulkOrders);

// ─── Admin Management Endpoints ──────────────────────────────────────────────
router.use(authenticate, authorize('admin'));

router.get('/admin', BulkOrderController.getQuotesAdmin);
router.get('/admin/stats', BulkOrderController.getQuoteStatsAdmin);
router.get(
  '/admin/:id',
  validate({ params: bulkOrderIdParamSchema }),
  BulkOrderController.getQuoteByIdAdmin
);
router.patch(
  '/admin/:id/status',
  validate({ params: bulkOrderIdParamSchema, body: updateBulkOrderStatusSchema }),
  BulkOrderController.updateQuoteStatusAdmin
);
router.delete(
  '/admin/:id',
  validate({ params: bulkOrderIdParamSchema }),
  BulkOrderController.deleteQuoteAdmin
);

export default router;
