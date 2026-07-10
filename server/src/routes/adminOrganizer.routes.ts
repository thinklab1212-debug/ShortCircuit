// ============================================================================
// Short Circuit — Admin Organizer Application Routes
// ============================================================================
// Routes for admin to manage organizer applications: list, view, approve,
// and reject applications from customers.
//
// Route prefix: /api/v1/admin/organizer-applications
// Auth: All routes require authentication + admin role.
// ============================================================================

import { Router } from 'express';
import * as OrganizerController from '../controllers/organizer.controller.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import { reviewOrganizerApplicationSchema } from '../validators/index.js';

const router = Router();

// All admin organizer routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// ─── List & Detail ───────────────────────────────────────────────────────────

router.get('/', OrganizerController.getAllApplications);
router.get('/:id', OrganizerController.getApplicationById);

// ─── Review Actions ──────────────────────────────────────────────────────────

router.patch(
  '/:id/approve',
  validate({ body: reviewOrganizerApplicationSchema }),
  OrganizerController.approveApplication
);

router.patch(
  '/:id/reject',
  validate({ body: reviewOrganizerApplicationSchema }),
  OrganizerController.rejectApplication
);

export default router;
