// ============================================================================
// ShortCircuit — Workshop Controller
// ============================================================================
// Request handlers for public showcase, experience logos, and admin management.
// ============================================================================

import { Request, Response } from 'express';
import { WorkshopService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export class WorkshopController {
  // ── Public Endpoints ───────────────────────────────────────────────────────

  static getActiveWorkshops = asyncHandler(async (_req: Request, res: Response) => {
    const workshops = await WorkshopService.getActiveWorkshops();
    res.status(200).json(new ApiResponse(200, workshops, 'Active workshops fetched successfully.'));
  });

  static getActiveExperience = asyncHandler(async (_req: Request, res: Response) => {
    const experience = await WorkshopService.getActiveExperience();
    res.status(200).json(new ApiResponse(200, experience, 'Active institution experience fetched successfully.'));
  });

  static createInquiry = asyncHandler(async (req: Request, res: Response) => {
    const inquiry = await WorkshopService.createInquiry(req.body);
    res.status(201).json(new ApiResponse(201, inquiry, 'Thank you for your inquiry. Our team will review your requirements and contact you shortly.'));
  });

  // ── Admin Workshops CRUD ───────────────────────────────────────────────────

  static getAllWorkshopsAdmin = asyncHandler(async (_req: Request, res: Response) => {
    const workshops = await WorkshopService.getAllWorkshopsAdmin();
    res.status(200).json(new ApiResponse(200, workshops, 'All workshops fetched successfully.'));
  });

  static createWorkshop = asyncHandler(async (req: Request, res: Response) => {
    const workshop = await WorkshopService.createWorkshop(req.body);
    res.status(201).json(new ApiResponse(201, workshop, 'Workshop created successfully.'));
  });

  static updateWorkshop = asyncHandler(async (req: Request, res: Response) => {
    const workshop = await WorkshopService.updateWorkshop(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, workshop, 'Workshop updated successfully.'));
  });

  static deleteWorkshop = asyncHandler(async (req: Request, res: Response) => {
    await WorkshopService.deleteWorkshop(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Workshop deleted successfully.'));
  });

  // ── Admin Experience CRUD ──────────────────────────────────────────────────

  static getAllExperienceAdmin = asyncHandler(async (_req: Request, res: Response) => {
    const experience = await WorkshopService.getAllExperienceAdmin();
    res.status(200).json(new ApiResponse(200, experience, 'All institutions fetched successfully.'));
  });

  static createExperience = asyncHandler(async (req: Request, res: Response) => {
    const experience = await WorkshopService.createExperience(req.body);
    res.status(201).json(new ApiResponse(201, experience, 'Institution added successfully.'));
  });

  static updateExperience = asyncHandler(async (req: Request, res: Response) => {
    const experience = await WorkshopService.updateExperience(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, experience, 'Institution updated successfully.'));
  });

  static deleteExperience = asyncHandler(async (req: Request, res: Response) => {
    await WorkshopService.deleteExperience(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Institution deleted successfully.'));
  });

  // ── Admin Inquiries Management ─────────────────────────────────────────────

  static getInquiriesAdmin = asyncHandler(async (req: Request, res: Response) => {
    const result = await WorkshopService.getInquiriesAdmin(req.query);
    res.status(200).json(new ApiResponse(200, result.docs, 'Inquiries fetched successfully.', result.pagination));
  });

  static updateInquiryStatus = asyncHandler(async (req: Request, res: Response) => {
    const inquiry = await WorkshopService.updateInquiryStatus(req.params.id, req.body.status);
    res.status(200).json(new ApiResponse(200, inquiry, 'Inquiry status updated successfully.'));
  });

  static deleteInquiry = asyncHandler(async (req: Request, res: Response) => {
    await WorkshopService.deleteInquiry(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Inquiry deleted successfully.'));
  });
}

export default WorkshopController;
