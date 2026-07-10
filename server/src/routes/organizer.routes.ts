// ============================================================================
// Short Circuit — Organizer Self-Service Routes
// ============================================================================
// Routes for customers to apply as organizers, check application status,
// and (once approved) manage events and teams.
//
// Route prefix: /api/v1/organizer
// Auth: All routes require authentication.
//   - Application routes: any authenticated user
//   - Event routes: requireOrganizer middleware
// ============================================================================

import { Router } from 'express';
import * as OrganizerController from '../controllers/organizer.controller.js';
import * as EventController from '../controllers/event.controller.js';
import { authenticate, requireOrganizer, validate, uploadCsv } from '../middlewares/index.js';
import {
  applyOrganizerSchema,
  createEventSchema,
  updateEventSchema,
  verifyTeamSchema,
} from '../validators/index.js';

const router = Router();

// All organizer routes require authentication
router.use(authenticate);

// ─── Application ─────────────────────────────────────────────────────────────

router.post(
  '/apply',
  validate({ body: applyOrganizerSchema }),
  OrganizerController.applyAsOrganizer
);

router.get('/application', OrganizerController.getMyApplication);

// ─── Events (Organizer only) ────────────────────────────────────────────────

router.post(
  '/events',
  requireOrganizer,
  validate({ body: createEventSchema }),
  EventController.createEvent
);

router.get(
  '/events',
  requireOrganizer,
  EventController.getOrganizerEvents
);

router.get(
  '/events/:id',
  requireOrganizer,
  EventController.getOrganizerEventById
);

router.patch(
  '/events/:id',
  requireOrganizer,
  validate({ body: updateEventSchema }),
  EventController.updateEvent
);

router.delete(
  '/events/:id',
  requireOrganizer,
  EventController.deleteEvent
);

// ─── Teams (Organizer only) ─────────────────────────────────────────────────

router.post(
  '/events/:id/teams/preview',
  requireOrganizer,
  uploadCsv.single('file'),
  EventController.previewTeams
);

router.post(
  '/events/:id/teams/import',
  requireOrganizer,
  EventController.importTeams
);

router.get(
  '/events/:id/teams',
  requireOrganizer,
  EventController.getTeams
);

router.patch(
  '/events/:id/teams/:teamId',
  requireOrganizer,
  EventController.updateTeam
);

router.delete(
  '/events/:id/teams/:teamId',
  requireOrganizer,
  EventController.deleteTeam
);

router.delete(
  '/events/:id/teams',
  requireOrganizer,
  EventController.clearTeams
);

// ─── Submit for Review (Organizer only) ──────────────────────────────────────

router.patch(
  '/events/:id/submit',
  requireOrganizer,
  EventController.submitForReview
);

router.get(
  '/events/:id/purchases',
  requireOrganizer,
  EventController.getOrganizerEventPurchases
);

export default router;
