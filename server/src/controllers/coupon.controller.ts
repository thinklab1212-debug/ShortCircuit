// ============================================================================
// ElectroKart — Coupon Controller
// ============================================================================
// Processes coupon operations, delegating queries/writes to CouponService.
// Supports pagination metadata formatting.
// ============================================================================

import { Request, Response } from 'express';
import { CouponService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const { code, cartTotal, cartCategoryIds } = req.body;
  const result = await CouponService.validateCoupon(code, userId, cartTotal, cartCategoryIds);
  res.status(200).json(new ApiResponse(200, result, 'Coupon validated successfully.'));
});

export const getAllCoupons = asyncHandler(async (req: Request, res: Response) => {
  const result = await CouponService.getAllCoupons(req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Coupons list retrieved successfully.', result.pagination)
  );
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await CouponService.createCoupon(req.body);
  res.status(201).json(new ApiResponse(201, coupon, 'Coupon created successfully.'));
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.couponId || req.params.id;
  const coupon = await CouponService.updateCoupon(id, req.body);
  res.status(200).json(new ApiResponse(200, coupon, 'Coupon updated successfully.'));
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.couponId || req.params.id;
  await CouponService.deleteCoupon(id);
  res.status(200).json(new ApiResponse(200, null, 'Coupon deleted successfully.'));
});
