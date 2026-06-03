// ============================================================================
// ElectroKart — Product Controller
// ============================================================================
// Processes incoming product requests, delegating queries/writes to service.
// Supports pagination metadata formatting.
// ============================================================================

import { Request, Response } from 'express';
import { ProductService } from '../services/index.js';
import { ApiResponse, asyncHandler } from '../utils/index.js';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await ProductService.getProducts(req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Products list retrieved.', result.pagination)
  );
});

export const getAdminProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await ProductService.getAdminProducts(req.query);
  res.status(200).json(
    new ApiResponse(200, result.docs, 'Admin products list retrieved.', result.pagination)
  );
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await ProductService.createProduct(req.body);
  res.status(201).json(new ApiResponse(201, product, 'Product created successfully.'));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await ProductService.updateProduct(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, product, 'Product updated successfully.'));
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await ProductService.deleteProduct(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Product deactivated successfully.'));
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const product = await ProductService.getProductBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, product, 'Product details retrieved.'));
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await ProductService.getProductById(req.params.id);
  res.status(200).json(new ApiResponse(200, product, 'Product details retrieved.'));
});

export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const products = await ProductService.getRelatedProducts(req.params.id, limit);
  res.status(200).json(new ApiResponse(200, products, 'Related products fetched.'));
});

export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const products = await ProductService.getFeaturedProducts(limit);
  res.status(200).json(new ApiResponse(200, products, 'Featured products fetched.'));
});

export const getSearchSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const suggestions = await ProductService.getSearchSuggestions(req.query.q as string, limit);
  res.status(200).json(new ApiResponse(200, suggestions, 'Search suggestions generated.'));
});
