// ============================================================================
// ElectroKart — Review Controller
// ============================================================================
// Processes reviews operations, delegating queries/writes to ReviewService.
// Supports pagination metadata formatting.
// ============================================================================

import { Request, Response } from 'express';
import { ReviewService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const result = await ReviewService.getProductReviews(productId, req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Product reviews fetched successfully.', result.pagination)
  );
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const { productId } = req.params;
  const review = await ReviewService.createReview(userId, productId, req.body);
  res.status(201).json(new ApiResponse(201, review, 'Review created successfully.'));
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const reviewId = req.params.reviewId || req.params.id;
  const review = await ReviewService.updateReview(userId, reviewId, req.body);
  res.status(200).json(new ApiResponse(200, review, 'Review updated successfully.'));
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const userRole = req.user!.role;
  const reviewId = req.params.reviewId || req.params.id;
  await ReviewService.deleteReview(userId, userRole, reviewId);
  res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully.'));
});
