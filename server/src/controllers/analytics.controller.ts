// ============================================================================
// ElectroKart — Analytics Controller
// ============================================================================
// Processes administrative metrics, delegating computations to AnalyticsService.
// ============================================================================

import { Request, Response } from 'express';
import { AnalyticsService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await AnalyticsService.getDashboardStats();
  res.status(200).json(new ApiResponse(200, stats, 'Admin dashboard summary statistics retrieved.'));
});

export const getRevenueData = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnalyticsService.getRevenueData();
  res.status(200).json(new ApiResponse(200, data, 'Revenue statistics retrieved.'));
});

export const getOrderStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await AnalyticsService.getOrderStats();
  res.status(200).json(new ApiResponse(200, stats, 'Orders summary statistics retrieved.'));
});

export const getTopProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const products = await AnalyticsService.getTopProducts(limit);
  res.status(200).json(new ApiResponse(200, products, 'Top-selling products retrieved.'));
});

export const getTopCategories = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnalyticsService.getTopCategories();
  res.status(200).json(new ApiResponse(200, data, 'Top-selling categories statistics retrieved.'));
});
