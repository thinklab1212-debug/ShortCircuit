// ============================================================================
// ElectroKart — Vendor Controller
// ============================================================================
// Handles vendor-related HTTP requests — delegates to VendorService.
// Follows the existing asyncHandler + ApiResponse pattern.
// ============================================================================

import { Request, Response } from 'express';
import { VendorService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

// ─── Admin: Vendor Management ────────────────────────────────────────────────

export const createVendor = asyncHandler(async (req: Request, res: Response) => {
  const { user, profile } = await VendorService.createVendor(req.body);
  res.status(201).json(
    new ApiResponse(201, { user, profile }, 'Vendor account created successfully.')
  );
});

export const getVendors = asyncHandler(async (req: Request, res: Response) => {
  const result = await VendorService.getVendors(req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Vendors listed successfully.', result.pagination)
  );
});

export const getVendorById = asyncHandler(async (req: Request, res: Response) => {
  const profile = await VendorService.getVendorById(req.params.id);
  res.status(200).json(new ApiResponse(200, profile, 'Vendor details retrieved.'));
});

// ─── Admin: Product Review ───────────────────────────────────────────────────

export const getReviewQueue = asyncHandler(async (req: Request, res: Response) => {
  const result = await VendorService.getReviewQueue(req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Review queue retrieved.', result.pagination)
  );
});

export const reviewProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await VendorService.reviewProduct(
    req.params.id,
    req.user!._id,
    req.body
  );
  const action = req.body.action === 'approve' ? 'approved' : 'rejected';
  res.status(200).json(
    new ApiResponse(200, product, `Product ${action} successfully.`)
  );
});

// ─── Vendor: Profile ─────────────────────────────────────────────────────────

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await VendorService.getProfile(req.user!._id);
  res.status(200).json(new ApiResponse(200, profile, 'Vendor profile retrieved.'));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await VendorService.updateProfile(req.user!._id, req.body);
  res.status(200).json(new ApiResponse(200, profile, 'Vendor profile updated.'));
});

// ─── Vendor: Dashboard ───────────────────────────────────────────────────────

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const stats = await VendorService.getDashboard(req.user!._id);
  res.status(200).json(new ApiResponse(200, stats, 'Dashboard stats retrieved.'));
});

// ─── Vendor: Products ────────────────────────────────────────────────────────

export const getVendorProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await VendorService.getVendorProducts(req.user!._id, req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Vendor products listed.', result.pagination)
  );
});

export const getVendorProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await VendorService.getVendorProduct(req.user!._id, req.params.id);
  res.status(200).json(new ApiResponse(200, product, 'Product details retrieved.'));
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await VendorService.createProduct(req.user!._id, req.body);
  res.status(201).json(new ApiResponse(201, product, 'Product created as draft.'));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await VendorService.updateProduct(req.user!._id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, product, 'Product updated successfully.'));
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await VendorService.deleteProduct(req.user!._id, req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Product deactivated successfully.'));
});

export const submitForReview = asyncHandler(async (req: Request, res: Response) => {
  const product = await VendorService.submitForReview(req.user!._id, req.params.id);
  res.status(200).json(new ApiResponse(200, product, 'Product submitted for review.'));
});
