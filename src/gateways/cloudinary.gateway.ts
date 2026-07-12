import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

import type { CloudinaryUploadResponse } from '../types/upload.types.js';

/**
 * Upload a single image buffer to Cloudinary
 * @param buffer - Image file buffer
 * @param folder - Optional folder path in Cloudinary (default: 'moorhall/images')
 * @param retries - Internal retry counter
 * @returns Cloudinary upload response with metadata
 */
export async function uploadSingleImage(
  buffer: Buffer,
  folder: string = 'moorhall/images',
  retries: number = 0
): Promise<CloudinaryUploadResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          // Check for stale request error - retry with exponential backoff
          if (
            error.message?.includes('Stale request') &&
            error.http_code === 400 &&
            retries < 3
          ) {
            console.warn(
              `[Cloudinary] Stale request error (attempt ${retries + 1}/3), retrying...`,
              error.message
            );

            // Exponential backoff with jitter: 1s, 2s, 4s
            const delayMs = 1000 * Math.pow(2, retries) + Math.random() * 500;
            setTimeout(() => {
              uploadSingleImage(buffer, folder, retries + 1)
                .then(resolve)
                .catch(reject);
            }, delayMs);
          } else if (retries >= 3) {
            // Final attempt failed - provide detailed diagnostics
            const errorMsg = `[Cloudinary] Upload failed after 3 retries. Last error: ${error.message}`;
            console.error(errorMsg);
            console.error(
              'Diagnostic: This typically means your server clock is out of sync with Cloudinary servers.'
            );
            console.error(
              'Fix: Run "w32tm /resync" (Windows) or check NTP sync on your server.'
            );
            reject(new Error(errorMsg));
          } else {
            reject(error);
          }
        } else if (result?.secure_url) {
          console.log(`[Cloudinary] Successfully uploaded image: ${result.secure_url}`);
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        } else {
          reject(new Error('No secure URL returned from Cloudinary'));
        }
      }
    );

    // Pipe buffer to upload stream
    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
}

/**
 * Upload multiple image buffers to Cloudinary
 * @param buffers - Array of image file buffers
 * @param folder - Optional folder path in Cloudinary (default: 'moorhall/images')
 * @returns Array of Cloudinary upload responses with metadata
 */
export async function uploadMultipleImages(
  buffers: Buffer[],
  folder: string = 'moorhall/images'
): Promise<CloudinaryUploadResponse[]> {
  if (!buffers || buffers.length === 0) {
    throw new Error('No buffers provided for upload');
  }

  console.log(`[Cloudinary] Starting upload of ${buffers.length} image(s)...`);

  try {
    const uploadPromises = buffers.map((buffer) =>
      uploadSingleImage(buffer, folder)
    );
    const results = await Promise.all(uploadPromises);
    console.log(
      `[Cloudinary] Successfully uploaded ${results.length} image(s)`
    );
    return results;
  } catch (error) {
    console.error('[Cloudinary] Upload failed:', error);
    throw error;
  }
}

/**
 * Delete an image from Cloudinary by public ID
 * @param publicId - Cloudinary public ID of the image to delete
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'ok') {
      console.log(`[Cloudinary] Successfully deleted image: ${publicId}`);
    } else {
      console.warn(
        `[Cloudinary] Delete result for ${publicId}:`,
        result.result
      );
    }
  } catch (error) {
    console.error(`[Cloudinary] Failed to delete image ${publicId}:`, error);
    throw error;
  }
}

/**
 * Delete multiple images from Cloudinary by public IDs
 * @param publicIds - Array of Cloudinary public IDs to delete
 */
export async function deleteMultipleImages(publicIds: string[]): Promise<void> {
  if (!publicIds || publicIds.length === 0) {
    return;
  }

  try {
    const deletePromises = publicIds.map((publicId) => deleteImage(publicId));
    await Promise.all(deletePromises);
    console.log(
      `[Cloudinary] Successfully deleted ${publicIds.length} image(s)`
    );
  } catch (error) {
    console.error('[Cloudinary] Batch delete failed:', error);
    throw error;
  }
}

/**
 * Verify Cloudinary configuration
 */
export function verifyCloudinaryConfig(): boolean {
  const { cloud_name, api_key, api_secret } = cloudinary.config();

  if (!cloud_name || !api_key || !api_secret) {
    console.error('[Cloudinary] Configuration incomplete:', {
      cloud_name: cloud_name ? 'set' : 'MISSING',
      api_key: api_key ? 'set' : 'MISSING',
      api_secret: api_secret ? 'set' : 'MISSING',
    });
    return false;
  }

  console.log('[Cloudinary] Configuration verified');
  return true;
}

export default {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  verifyCloudinaryConfig,
};
