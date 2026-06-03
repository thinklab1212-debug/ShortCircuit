// ============================================================================
// ElectroKart — Cart Controller
// ============================================================================
// Processes shopping cart requests, delegating queries/writes to CartService.
// ============================================================================

import { Request, Response } from 'express';
import { CartService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const cart = await CartService.getCart(userId);
  res.status(200).json(new ApiResponse(200, cart, 'Cart retrieved successfully.'));
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const { productId, variant, quantity } = req.body;
  const cart = await CartService.addToCart(userId, productId, variant, quantity);
  res.status(200).json(new ApiResponse(200, cart, 'Item added to cart successfully.'));
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const itemId = req.params.itemId || req.params.id;
  const { quantity } = req.body;
  const cart = await CartService.updateQuantity(userId, itemId, quantity);
  res.status(200).json(new ApiResponse(200, cart, 'Cart item quantity updated successfully.'));
});

export const removeFromCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const itemId = req.params.itemId || req.params.id;
  const cart = await CartService.removeFromCart(userId, itemId);
  res.status(200).json(new ApiResponse(200, cart, 'Item removed from cart successfully.'));
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  await CartService.clearCart(userId);
  res.status(200).json(new ApiResponse(200, null, 'Cart cleared successfully.'));
});

export const getCartTotals = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const couponCode = req.query.couponCode as string | undefined;
  const totals = await CartService.calculateTotals(userId, couponCode);
  res.status(200).json(new ApiResponse(200, totals, 'Cart totals calculated successfully.'));
});
