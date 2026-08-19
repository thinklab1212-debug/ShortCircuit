// ============================================================================
// ElectroKart — System Settings Routes
// ============================================================================
// Public and Admin endpoints for global application settings & maintenance mode.
// ============================================================================

import { Router } from 'express';
import {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
} from '../controllers/systemSettings.controller.js';
import { authenticate, authorize } from '../middlewares/index.js';

const router = Router();

// Public endpoint (unauthenticated)
router.get('/public', getPublicSettings);

// Admin-only endpoints
router.get('/admin', authenticate, authorize('admin'), getAdminSettings);
router.patch('/admin', authenticate, authorize('admin'), updateAdminSettings);

export default router;
