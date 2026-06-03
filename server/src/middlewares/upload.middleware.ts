// ============================================================================
// ElectroKart — File Upload Middleware (Multer Config)
// ============================================================================
// Sets up Multer with memory storage filters for processing image and PDF uploads.
// Enforces strict file-type restrictions and file-size limits.
// ============================================================================

import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { ApiError } from '../utils/index.js';

// ---------------------------------------------------------------------------
// Storage Engine Selection
// ---------------------------------------------------------------------------
// We use memory storage because we stream buffers directly to Cloudinary.
// This prevents writing temp files to server disk, ensuring clean execution.
const storage = multer.memoryStorage();

// ---------------------------------------------------------------------------
// File Type Filters
// ---------------------------------------------------------------------------

/**
 * Filter to only allow image uploads (JPEG, PNG, WEBP).
 */
const imageFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, and WEBP images are allowed.'));
  }
};

/**
 * Filter to only allow PDF uploads.
 */
const pdfFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only PDF datasheets are allowed.'));
  }
};

// ---------------------------------------------------------------------------
// Multer Configuration Instances
// ---------------------------------------------------------------------------

/**
 * Upload helper for images (avatar, category, product, banners).
 * Enforces a 5MB limit.
 */
export const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 15, // Max 15 files per request
  },
});

/**
 * Upload helper for engineering datasheets (PDFs).
 * Enforces a 10MB limit.
 */
export const uploadDatasheet = multer({
  storage,
  fileFilter: pdfFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
  },
});

export default {
  uploadImages,
  uploadDatasheet,
};
