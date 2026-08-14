// ============================================================================
// ShortCircuit — Delivery Pincode Routes
// ============================================================================
// Customer: public pincode serviceability check (no auth required).
// Admin: full CRUD (authenticated + admin role required).
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  checkPincodeSchema,
  createDeliveryPincodeSchema,
  updateDeliveryPincodeSchema,
  togglePincodeStatusSchema,
  deliveryPincodeIdSchema,
  deliveryPincodeListQuerySchema,
} from '../validators/deliveryPincode.validator.js';
import * as DeliveryPincodeController from '../controllers/deliveryPincode.controller.js';

const router = Router();

// ---------------------------------------------------------------------------
// Public: customer pincode check
// ---------------------------------------------------------------------------

router.post(
  '/check',
  validate({ body: checkPincodeSchema }),
  DeliveryPincodeController.checkPincode
);

// ---------------------------------------------------------------------------
// Admin: CRUD operations (all require authentication + admin role)
// ---------------------------------------------------------------------------

router.get(
  '/admin',
  authenticate,
  authorize('admin'),
  validate({ query: deliveryPincodeListQuerySchema }),
  DeliveryPincodeController.getAllPincodes
);

router.post(
  '/admin',
  authenticate,
  authorize('admin'),
  validate({ body: createDeliveryPincodeSchema }),
  DeliveryPincodeController.createPincode
);

router.put(
  '/admin/:id',
  authenticate,
  authorize('admin'),
  validate({ params: deliveryPincodeIdSchema, body: updateDeliveryPincodeSchema }),
  DeliveryPincodeController.updatePincode
);

router.patch(
  '/admin/:id/status',
  authenticate,
  authorize('admin'),
  validate({ params: deliveryPincodeIdSchema, body: togglePincodeStatusSchema }),
  DeliveryPincodeController.togglePincodeStatus
);

router.delete(
  '/admin/:id',
  authenticate,
  authorize('admin'),
  validate({ params: deliveryPincodeIdSchema }),
  DeliveryPincodeController.deletePincode
);

export default router;
