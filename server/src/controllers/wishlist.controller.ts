// ============================================================================
// ElectroKart — Wishlist Controller
// ============================================================================
// Processes user wishlist requests, delegating queries/writes to WishlistService.
// ============================================================================

import { Request, Response } from 'express';
import { WishlistService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const wishlist = await WishlistService.getWishlist(userId);
  res.status(200).json(new ApiResponse(200, wishlist, 'Wishlist retrieved successfully.'));
});

export const toggleWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const productId = req.params.productId || req.params.id;
  const wishlist = await WishlistService.toggleWishlist(userId, productId);
  res.status(200).json(new ApiResponse(200, wishlist, 'Wishlist updated successfully.'));
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const productId = req.params.productId || req.params.id;
  const wishlist = await WishlistService.removeFromWishlist(userId, productId);
  res.status(200).json(new ApiResponse(200, wishlist, 'Product removed from wishlist successfully.'));
});
