// ============================================================================
// ElectroKart — Cloudinary Configuration
// ============================================================================
// Configures and exports the Cloudinary SDK client for media storage.
// Supports uploading product images, category icons/banners, and store banners.
// ============================================================================

import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

// ---------------------------------------------------------------------------
// Cloudinary SDK Configuration
// ---------------------------------------------------------------------------

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS
});

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export default cloudinary;
