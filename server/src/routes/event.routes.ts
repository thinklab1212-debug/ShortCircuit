// ============================================================================
// Short Circuit — Public & Student Event Routes
// ============================================================================
// Routes for public event browsing and student team verification + purchase.
//
// Route prefix: /api/v1/events
// Auth:
//   - GET / and GET /:slug are public (no auth required)
//   - POST /:id/verify-team requires authentication
//   - POST /:id/purchase requires authentication
// ============================================================================

import { Router } from 'express';
import * as EventController from '../controllers/event.controller.js';
import { authenticate, validate, teamVerifyLimiter } from '../middlewares/index.js';
import { verifyTeamSchema, purchaseEventKitSchema } from '../validators/index.js';

const router = Router();

// ─── Public: Event Listing ───────────────────────────────────────────────────

router.get('/', EventController.getPublicEvents);
router.get('/:slug', EventController.getPublicEventBySlug);

// ─── Student: Team Verification (Authenticated + Rate Limited) ───────────────

router.post(
  '/:id/verify-team',
  authenticate,
  teamVerifyLimiter,
  validate({ body: verifyTeamSchema }),
  EventController.verifyTeam
);

// ─── Student: Checkout and Purchase (Authenticated) ──────────────────────────

router.get(
  '/:id/checkout',
  authenticate,
  EventController.checkoutEventKit
);

router.post(
  '/:id/purchase',
  authenticate,
  validate({ body: purchaseEventKitSchema }),
  EventController.purchaseEventKit
);

// ─── Customer: Event Order Dashboard & Invoice (Authenticated) ──────────────

router.get(
  '/my-orders',
  authenticate,
  EventController.getCustomerEventOrders
);

router.get(
  '/orders/:id/invoice',
  authenticate,
  EventController.downloadEventInvoice
);

export default router;
