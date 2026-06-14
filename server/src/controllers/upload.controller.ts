// ============================================================================
// ElectroKart — Media Upload Controller
// ============================================================================
// Processes image and file uploads, streaming memory buffers directly to Cloudinary.
// ============================================================================

import { Request, Response } from 'express';
import { UploadService } from '../services/index.js';
import { ApiResponse, asyncHandler, ApiError } from '../utils/index.js';

export const uploadSingleImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('No image file was uploaded.');
  }

  const folder = (req.query.folder as string) || 'general';
  const result = await UploadService.uploadBuffer(req.file.buffer, folder);

  res.status(200).json(new ApiResponse(200, result, 'Image uploaded successfully.'));
});

export const uploadSinglePdf = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('No PDF file was uploaded.');
  }

  const folder = (req.query.folder as string) || 'documents';
  const result = await UploadService.uploadBuffer(req.file.buffer, folder);

  res.status(200).json(new ApiResponse(200, result, 'PDF uploaded successfully.'));
});

export const uploadMultipleImages = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files;
  if (!files || (Array.isArray(files) && files.length === 0)) {
    throw ApiError.badRequest('No image files were uploaded.');
  }

  const folder = (req.query.folder as string) || 'general';
  const fileArray = Array.isArray(files) ? files : Object.values(files).flat();

  const uploadPromises = fileArray.map((file: any) =>
    UploadService.uploadBuffer(file.buffer, folder)
  );

  const results = await Promise.all(uploadPromises);

  res.status(200).json(new ApiResponse(200, results, 'Images uploaded successfully.'));
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  // Try to read publicId from route parameters, or query parameter if encoded with slashes
  const publicId = req.params.publicId || (req.query.publicId as string);
  
  if (!publicId) {
    throw ApiError.badRequest('Asset publicId is required for deletion.');
  }

  const success = await UploadService.deleteAsset(publicId);
  if (!success) {
    throw ApiError.badRequest('Failed to delete image asset from Cloudinary.');
  }

  res.status(200).json(new ApiResponse(200, null, 'Image deleted successfully.'));
});
