// ============================================================================
// ElectroKart — Category Controller
// ============================================================================
// Processes category requests, delegating tree/CRUD actions to category service.
// ============================================================================

import { Request, Response } from 'express';
import { CategoryService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await CategoryService.getCategories();
  res.status(200).json(new ApiResponse(200, categories, 'Categories fetched successfully.'));
});

export const getCategoryTree = asyncHandler(async (req: Request, res: Response) => {
  const tree = await CategoryService.getCategoryTree();
  res.status(200).json(new ApiResponse(200, tree, 'Category tree fetched successfully.'));
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await CategoryService.createCategory(req.body);
  res.status(201).json(new ApiResponse(201, category, 'Category created successfully.'));
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await CategoryService.updateCategory(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, category, 'Category updated successfully.'));
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await CategoryService.deleteCategory(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Category deleted successfully.'));
});
