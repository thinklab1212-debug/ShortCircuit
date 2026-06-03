// ============================================================================
// ElectroKart — Banner Controller
// ============================================================================
// Processes storefront promotion banner requests, delegating to BannerService.
// Supports pagination metadata formatting.
// ============================================================================

import { Request, Response } from 'express';
import { BannerService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export const getActiveBanners = asyncHandler(async (req: Request, res: Response) => {
  const banners = await BannerService.getActiveBanners();
  res.status(200).json(new ApiResponse(200, banners, 'Active promotional banners fetched successfully.'));
});

export const getAllBanners = asyncHandler(async (req: Request, res: Response) => {
  const result = await BannerService.getAllBanners(req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Banners list retrieved successfully.', result.pagination)
  );
});

export const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const banner = await BannerService.createBanner(req.body);
  res.status(201).json(new ApiResponse(201, banner, 'Banner created successfully.'));
});

export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.bannerId || req.params.id;
  const banner = await BannerService.updateBanner(id, req.body);
  res.status(200).json(new ApiResponse(200, banner, 'Banner updated successfully.'));
});

export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.bannerId || req.params.id;
  await BannerService.deleteBanner(id);
  res.status(200).json(new ApiResponse(200, null, 'Banner deleted successfully.'));
});
