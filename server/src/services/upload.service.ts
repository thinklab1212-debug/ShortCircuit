// ============================================================================
// ElectroKart — Media Upload Service
// ============================================================================
// Handles streaming file buffers directly to Cloudinary without writing
// files locally. Provides asset upload and destruction workflows.
// ============================================================================

import cloudinary from '../config/cloudinary.js';
import { ApiError, logger } from '../utils/index.js';

export class UploadService {
  /**
   * Uploads a file buffer directly to a targeted Cloudinary folder path.
   *
   * @param buffer - File binary buffer (from Multer memory storage)
   * @param folder - Destination subfolder (e.g. 'products', 'categories', 'banners')
   */
  public static async uploadBuffer(
    buffer: Buffer,
    folder: string
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      logger.info(`📤 Direct buffer upload starting for Cloudinary subfolder: electrokart/${folder}`);
      
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `electrokart/${folder}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            logger.error('❌ Cloudinary stream upload failed:', error);
            return reject(new ApiError(500, `Cloudinary upload failed: ${error.message}`));
          }
          
          if (!result) {
            return reject(new ApiError(500, 'Cloudinary upload succeeded but returned empty result'));
          }

          logger.info(`✅ Cloudinary upload complete. Resource URL: ${result.secure_url}`);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Deletes an asset from Cloudinary using its unique public ID.
   *
   * @param publicId - Cloudinary unique asset ID
   */
  public static async deleteAsset(publicId: string): Promise<boolean> {
    try {
      logger.info(`🗑️ Destroying Cloudinary asset public ID: ${publicId}`);
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result !== 'ok') {
        logger.warn(`⚠️ Cloudinary destroy response: ${result.result} for ID: ${publicId}`);
        return false;
      }

      logger.info(`✅ Cloudinary asset destroyed successfully.`);
      return true;
    } catch (error) {
      logger.error(`❌ Cloudinary destroy operation failed:`, error);
      throw new ApiError(500, 'Failed to delete asset from Cloudinary.');
    }
  }
}

export default UploadService;
