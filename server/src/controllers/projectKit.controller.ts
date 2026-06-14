// ============================================================================
// ElectroKart — ProjectKit Controller
// ============================================================================
// Processes Smart Project Builder requests. Public endpoints for browsing
// and BOM viewing. Authenticated endpoint for add-kit-to-cart. Admin-only
// endpoints for project CRUD.
// ============================================================================

import { Request, Response } from 'express';
import { ProjectKitService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

// ─── Public Endpoints ───────────────────────────────────────────────────────

export const getActiveProjects = asyncHandler(async (req: Request, res: Response) => {
  const result = await ProjectKitService.getActiveProjects(req.query as any);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Projects retrieved successfully.', result.pagination)
  );
});

export const getFeaturedProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await ProjectKitService.getFeaturedProjects();
  res.status(200).json(new ApiResponse(200, projects, 'Featured projects retrieved successfully.'));
});

export const getProjectBySlug = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params.slug;
  const project = await ProjectKitService.getProjectBySlug(slug);
  res.status(200).json(new ApiResponse(200, project, 'Project details retrieved successfully.'));
});

export const getProjectBom = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params.slug;
  const bom = await ProjectKitService.getProjectBom(slug);
  res.status(200).json(new ApiResponse(200, bom, 'BOM with pricing retrieved successfully.'));
});

// ─── Authenticated Endpoint ─────────────────────────────────────────────────

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const projectId = req.params.id;
  const result = await ProjectKitService.addProjectToCart(userId, projectId);
  res.status(200).json(new ApiResponse(200, result, 'Project components processed for cart.'));
});

// ─── Admin Endpoints ────────────────────────────────────────────────────────

export const getAllProjects = asyncHandler(async (req: Request, res: Response) => {
  const result = await ProjectKitService.getAllProjects(req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'All projects retrieved successfully.', result.pagination)
  );
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const project = await ProjectKitService.getProjectById(id);
  res.status(200).json(new ApiResponse(200, project, 'Project retrieved successfully.'));
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await ProjectKitService.createProject(req.body);
  res.status(201).json(new ApiResponse(201, project, 'Project created successfully.'));
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const project = await ProjectKitService.updateProject(id, req.body);
  res.status(200).json(new ApiResponse(200, project, 'Project updated successfully.'));
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  await ProjectKitService.deleteProject(id);
  res.status(200).json(new ApiResponse(200, null, 'Project deleted successfully.'));
});
