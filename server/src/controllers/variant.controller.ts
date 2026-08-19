// ============================================================================
// ElectroKart — Variant Controller
// ============================================================================
// Processes incoming HTTP requests for component variants, delegating business logic
// to VariantService. Thin controller handlers wrapped in asyncHandler.
// ============================================================================

import { Request, Response } from 'express';
import { VariantService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export const createVariant = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.productId;
  const variant = await VariantService.createVariant(productId, req.body);
  res.status(201).json(new ApiResponse(201, variant, 'Product variant created successfully.'));
});

export const batchCreateVariants = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.productId;
  const dryRun = req.query.dryRun === 'true' || req.body.dryRun === true;

  const result = await VariantService.batchCreateVariants(productId, {
    variants: req.body.variants,
    dryRun,
  });

  const statusCode = result.isValid ? 201 : 400;
  const message = dryRun
    ? 'Batch dry-run validation report generated.'
    : result.isValid
      ? `Batch variant import completed. Created ${result.validCount} variants.`
      : 'Batch validation failed.';

  res.status(statusCode).json(new ApiResponse(statusCode, result, message));
});

export const updateVariant = asyncHandler(async (req: Request, res: Response) => {
  const variant = await VariantService.updateVariant(req.params.variantId, req.body);
  res.status(200).json(new ApiResponse(200, variant, 'Product variant updated successfully.'));
});

export const deleteVariant = asyncHandler(async (req: Request, res: Response) => {
  await VariantService.deleteVariant(req.params.variantId);
  res.status(200).json(new ApiResponse(200, null, 'Product variant deactivated successfully.'));
});

export const getVariantsByProductId = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.productId;
  const result = await VariantService.getVariantsByProductId(productId, req.query);
  res.status(200).json(new ApiResponse(200, result.docs, 'Product variants retrieved.', result.pagination));
});

export const parametricSearch = asyncHandler(async (req: Request, res: Response) => {
  const result = await VariantService.parametricSearch(req.query);
  res.status(200).json(new ApiResponse(200, result.docs, 'Parametric search results retrieved.', result.pagination));
});
