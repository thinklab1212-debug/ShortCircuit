// ============================================================================
// ShortCircuit — Workshop Routes
// ============================================================================
// Public endpoints for workshop showcase, experience logos, and inquiry submissions,
// plus protected admin management endpoints.
// ============================================================================

import { Router } from 'express';
import { WorkshopController } from '../controllers/index.js';
import { authenticate, authorize, validate } from '../middlewares/index.js';
import {
  createWorkshopSchema,
  updateWorkshopSchema,
  createWorkshopExperienceSchema,
  updateWorkshopExperienceSchema,
  createWorkshopInquirySchema,
  updateWorkshopInquiryStatusSchema,
  workshopIdParamSchema,
} from '../validators/index.js';

const router = Router();

// ─── Public Endpoints ─────────────────────────────────────────────────────────

router.get('/', WorkshopController.getActiveWorkshops);
router.get('/experience', WorkshopController.getActiveExperience);
router.post(
  '/inquire',
  validate({ body: createWorkshopInquirySchema }),
  WorkshopController.createInquiry
);

// ─── Admin Management Endpoints ───────────────────────────────────────────────
router.use(authenticate, authorize('admin'));

// Workshops CRUD
router.get('/admin/all', WorkshopController.getAllWorkshopsAdmin);
router.post(
  '/admin',
  validate({ body: createWorkshopSchema }),
  WorkshopController.createWorkshop
);
router.put(
  '/admin/:id',
  validate({ params: workshopIdParamSchema, body: updateWorkshopSchema }),
  WorkshopController.updateWorkshop
);
router.delete(
  '/admin/:id',
  validate({ params: workshopIdParamSchema }),
  WorkshopController.deleteWorkshop
);

// Experience Organizations CRUD
router.get('/admin/experience/all', WorkshopController.getAllExperienceAdmin);
router.post(
  '/admin/experience',
  validate({ body: createWorkshopExperienceSchema }),
  WorkshopController.createExperience
);
router.put(
  '/admin/experience/:id',
  validate({ params: workshopIdParamSchema, body: updateWorkshopExperienceSchema }),
  WorkshopController.updateExperience
);
router.delete(
  '/admin/experience/:id',
  validate({ params: workshopIdParamSchema }),
  WorkshopController.deleteExperience
);

// Workshop Inquiries Management
router.get('/admin/inquiries', WorkshopController.getInquiriesAdmin);
router.patch(
  '/admin/inquiries/:id/status',
  validate({ params: workshopIdParamSchema, body: updateWorkshopInquiryStatusSchema }),
  WorkshopController.updateInquiryStatus
);
router.delete(
  '/admin/inquiries/:id',
  validate({ params: workshopIdParamSchema }),
  WorkshopController.deleteInquiry
);

export default router;
