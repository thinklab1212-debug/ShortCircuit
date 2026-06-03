// ============================================================================
// ElectroKart — Brand Controller
// ============================================================================
// Processes brand requests, delegating CRUD actions to brand service.
// ============================================================================

import { Request, Response } from 'express';
import { BrandService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export const getBrands = asyncHandler(async (req: Request, res: Response) => {
  const brands = await BrandService.getBrands(false);
  res.status(200).json(new ApiResponse(200, brands, 'Brands fetched successfully.'));
});

export const getAdminBrands = asyncHandler(async (req: Request, res: Response) => {
  const brands = await BrandService.getBrands(true);
  res.status(200).json(new ApiResponse(200, brands, 'All brands listed.'));
});

export const getBrandBySlug = asyncHandler(async (req: Request, res: Response) => {
  const brand = await BrandService.getBrandBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, brand, 'Brand details retrieved.'));
});

export const createBrand = asyncHandler(async (req: Request, res: Response) => {
  const brand = await BrandService.createBrand(req.body);
  res.status(201).json(new ApiResponse(201, brand, 'Brand created successfully.'));
});

export const updateBrand = asyncHandler(async (req: Request, res: Response) => {
  const brand = await BrandService.updateBrand(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, brand, 'Brand updated successfully.'));
});

export const deleteBrand = asyncHandler(async (req: Request, res: Response) => {
  await BrandService.deleteBrand(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Brand deleted successfully.'));
});
