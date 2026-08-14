// ============================================================================
// ShortCircuit — Delivery Pincode Controller
// ============================================================================
// Handles customer serviceability checks and admin CRUD operations for
// delivery pincodes.
// ============================================================================

import { Request, Response } from 'express';
import { DeliveryPincodeService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

// ---------------------------------------------------------------------------
// Customer: check pincode serviceability
// ---------------------------------------------------------------------------

export const checkPincode = asyncHandler(async (req: Request, res: Response) => {
  const { pincode } = req.body;
  const result = await DeliveryPincodeService.checkServiceability(pincode);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

// ---------------------------------------------------------------------------
// Admin: create delivery pincode
// ---------------------------------------------------------------------------

export const createPincode = asyncHandler(async (req: Request, res: Response) => {
  const record = await DeliveryPincodeService.create(req.body);
  res.status(201).json(new ApiResponse(201, record, 'Delivery pincode created successfully.'));
});

// ---------------------------------------------------------------------------
// Admin: list all delivery pincodes (paginated, searchable)
// ---------------------------------------------------------------------------

export const getAllPincodes = asyncHandler(async (req: Request, res: Response) => {
  const result = await DeliveryPincodeService.getAll(req.query as any);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Delivery pincodes retrieved.', result.pagination)
  );
});

// ---------------------------------------------------------------------------
// Admin: update delivery pincode
// ---------------------------------------------------------------------------

export const updatePincode = asyncHandler(async (req: Request, res: Response) => {
  const record = await DeliveryPincodeService.update(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, record, 'Delivery pincode updated successfully.'));
});

// ---------------------------------------------------------------------------
// Admin: toggle active/inactive status
// ---------------------------------------------------------------------------

export const togglePincodeStatus = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.body;
  const record = await DeliveryPincodeService.toggleStatus(req.params.id, isActive);
  const statusLabel = record.isActive ? 'enabled' : 'disabled';
  res.status(200).json(
    new ApiResponse(200, record, `Delivery pincode ${statusLabel} successfully.`)
  );
});

// ---------------------------------------------------------------------------
// Admin: delete delivery pincode
// ---------------------------------------------------------------------------

export const deletePincode = asyncHandler(async (req: Request, res: Response) => {
  await DeliveryPincodeService.remove(req.params.id);
  res.status(200).json(ApiResponse.noContent('Delivery pincode deleted successfully.'));
});
