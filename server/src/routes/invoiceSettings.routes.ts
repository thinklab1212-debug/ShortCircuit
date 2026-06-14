// ============================================================================
// ElectroKart — Invoice Settings Routes
// ============================================================================
// Defines paths for retrieving, updating, and previewing invoice settings.
// Restricted entirely to users with 'admin' roles.
// ============================================================================

import { Router } from 'express';
import { InvoiceSettingsController } from '../controllers/index.js';
import { authenticate, authorize } from '../middlewares/index.js';

const router = Router();

// All settings routes require admin authentication and authorization
router.use(authenticate, authorize('admin'));

router.get('/', InvoiceSettingsController.getInvoiceSettings);
router.put('/', InvoiceSettingsController.updateInvoiceSettings);
router.get('/preview', InvoiceSettingsController.getInvoicePreview);

export default router;
