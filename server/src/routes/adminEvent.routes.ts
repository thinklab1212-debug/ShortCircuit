// ============================================================================
// Short Circuit — Admin Event Management Routes
// ============================================================================
// Routes for admin to manage events: list, view, approve, and reject events.
//
// Route prefix: /api/v1/admin/events
// Auth: All routes require authentication + admin role.
// ============================================================================

import { Router } from 'express';
import * as EventController from '../controllers/event.controller.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import { rejectEventSchema, updateEventOrderStatusSchema } from '../validators/index.js';

const router = Router();

// All admin event routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// ─── List & Detail ───────────────────────────────────────────────────────────

router.get('/orders', EventController.getAdminEventOrders);
router.patch(
  '/orders/:id/status',
  validate({ body: updateEventOrderStatusSchema }),
  EventController.updateAdminEventOrderStatus
);
router.get('/', EventController.getAllEvents);
router.get('/:id', EventController.getEventByIdAdmin);

// ─── Review Actions ──────────────────────────────────────────────────────────

router.patch('/:id/approve', EventController.approveEvent);

router.patch(
  '/:id/reject',
  validate({ body: rejectEventSchema }),
  EventController.rejectEvent
);

export default router;
