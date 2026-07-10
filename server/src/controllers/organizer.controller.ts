// ============================================================================
// Short Circuit — Organizer Controller
// ============================================================================
// Request handlers for organizer application operations.
// Delegates to OrganizerService for business logic.
//
// Implementation will be added in Phase 2.
// ============================================================================

import { Request, Response } from 'express';
import { OrganizerService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

// ---------------------------------------------------------------------------
// Customer: Apply as Organizer
// ---------------------------------------------------------------------------

export const applyAsOrganizer = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const result = await OrganizerService.applyAsOrganizer(userId, req.body);
  res.status(201).json(new ApiResponse(201, result, 'Organizer application submitted successfully.'));
});

// ---------------------------------------------------------------------------
// Customer: Get My Application Status
// ---------------------------------------------------------------------------

export const getMyApplication = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const result = await OrganizerService.getMyApplication(userId);
  res.status(200).json(new ApiResponse(200, result, 'Application status retrieved.'));
});

// ---------------------------------------------------------------------------
// Admin: List All Applications
// ---------------------------------------------------------------------------

export const getAllApplications = asyncHandler(async (req: Request, res: Response) => {
  const result = await OrganizerService.getAllApplications(req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Organizer applications retrieved.', result.pagination)
  );
});

// ---------------------------------------------------------------------------
// Admin: Get Single Application
// ---------------------------------------------------------------------------

export const getApplicationById = asyncHandler(async (req: Request, res: Response) => {
  const result = await OrganizerService.getApplicationById(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Application details retrieved.'));
});

// ---------------------------------------------------------------------------
// Admin: Approve Application
// ---------------------------------------------------------------------------

export const approveApplication = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = req.user!._id;
  const result = await OrganizerService.approveApplication(
    req.params.id,
    adminUserId,
    req.body.adminResponse
  );
  res.status(200).json(new ApiResponse(200, result, 'Organizer application approved.'));
});

// ---------------------------------------------------------------------------
// Admin: Reject Application
// ---------------------------------------------------------------------------

export const rejectApplication = asyncHandler(async (req: Request, res: Response) => {
  const adminUserId = req.user!._id;
  const result = await OrganizerService.rejectApplication(
    req.params.id,
    adminUserId,
    req.body.adminResponse
  );
  res.status(200).json(new ApiResponse(200, result, 'Organizer application rejected.'));
});
