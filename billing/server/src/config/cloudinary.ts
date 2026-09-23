import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = Boolean(
  cloudName &&
  apiKey &&
  apiSecret &&
  !apiSecret.includes('REPLACE_WITH')
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log(`✅ [Cloudinary] Initialized with cloud: ${cloudName}`);
} else {
  console.warn('⚠️ [Cloudinary] Incomplete or placeholder credentials. Local PDF generation and streaming will be used as primary storage.');
}

export { cloudinary, isConfigured };
