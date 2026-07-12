import prisma from '../config/db.js';
import * as cloudinaryGateway from '../gateways/cloudinary.gateway.js';
import ApiError from '../utils/apiError.js';
import type { ImageMetadata, UploadFolder, UploadResult, SingleImageUploadResult } from '../types/upload.types.js';
import { UPLOAD_ERROR_MESSAGES } from '../types/upload.types.js';

/**
 * Upload service for handling image uploads to Cloudinary
 */

/**
 * Upload single image for a menu item
 * @param buffer - Image file buffer
 * @param menuItemId - Menu item ID
 * @returns Upload result with image metadata
 */
export async function uploadMenuItemImage(
  buffer: Buffer,
  menuItemId: number
): Promise<SingleImageUploadResult> {
  try {
    const image = await cloudinaryGateway.uploadSingleImage(
      buffer,
      'moorhall/menu-items'
    );

    // Store image metadata in database
    const menuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        imageUrl: image.secure_url,
        imagePublicId: image.public_id,
      },
    });

    return {
      success: true,
      image,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading menu item image:', error);
    throw ApiError.internal(UPLOAD_ERROR_MESSAGES.UPLOAD_FAILED);
  }
}

/**
 * Upload multiple images for gallery
 * @param buffers - Array of image file buffers
 * @param galleryTitle - Gallery title for reference
 * @returns Upload result with all image metadata
 */
export async function uploadGalleryImages(
  buffers: Buffer[],
  galleryTitle?: string
): Promise<UploadResult> {
  try {
    if (!buffers || buffers.length === 0) {
      throw ApiError.badRequest(UPLOAD_ERROR_MESSAGES.NO_FILES);
    }

    const images = await cloudinaryGateway.uploadMultipleImages(
      buffers,
      'moorhall/gallery'
    );

    // Calculate total size
    const totalSize = buffers.reduce((sum, buf) => sum + buf.length, 0);

    return {
      success: true,
      images,
      uploadedAt: new Date().toISOString(),
      totalSize,
    };
  } catch (error) {
    console.error('Error uploading gallery images:', error);
    throw ApiError.internal(UPLOAD_ERROR_MESSAGES.UPLOAD_FAILED);
  }
}

/**
 * Upload images for catering request
 * @param buffers - Array of image file buffers
 * @param cateringRequestId - Catering request ID
 * @returns Upload result with image metadata
 */
export async function uploadCateringImages(
  buffers: Buffer[],
  cateringRequestId: number
): Promise<UploadResult> {
  try {
    if (!buffers || buffers.length === 0) {
      throw ApiError.badRequest(UPLOAD_ERROR_MESSAGES.NO_FILES);
    }

    const images = await cloudinaryGateway.uploadMultipleImages(
      buffers,
      'moorhall/catering-events'
    );

    // Calculate total size
    const totalSize = buffers.reduce((sum, buf) => sum + buf.length, 0);

    // Note: You may want to store these images in a separate table or JSON field
    // For now, returning the upload result
    return {
      success: true,
      images,
      uploadedAt: new Date().toISOString(),
      totalSize,
    };
  } catch (error) {
    console.error('Error uploading catering images:', error);
    throw ApiError.internal(UPLOAD_ERROR_MESSAGES.UPLOAD_FAILED);
  }
}

/**
 * Upload images for service items
 * @param buffer - Image file buffer
 * @param serviceItemId - Service item ID
 * @returns Upload result with image metadata
 */
export async function uploadServiceItemImage(
  buffer: Buffer,
  serviceItemId: number
): Promise<SingleImageUploadResult> {
  try {
    const image = await cloudinaryGateway.uploadSingleImage(
      buffer,
      'moorhall/service-items'
    );

    // Store image metadata in database
    await prisma.serviceItem.update({
      where: { id: serviceItemId },
      data: {
        imageUrl: image.secure_url,
        imagePublicId: image.public_id,
      },
    });

    return {
      success: true,
      image,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading service item image:', error);
    throw ApiError.internal(UPLOAD_ERROR_MESSAGES.UPLOAD_FAILED);
  }
}

/**
 * Upload single image to generic folder (for pre-upload before item creation)
 * @param buffer - Image file buffer
 * @param folder - Cloudinary folder path
 * @returns Upload result with image metadata
 */
export async function uploadImageToFolder(
  buffer: Buffer,
  folder: string
): Promise<SingleImageUploadResult> {
  try {
    const image = await cloudinaryGateway.uploadSingleImage(buffer, folder);

    return {
      success: true,
      image,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw ApiError.internal(UPLOAD_ERROR_MESSAGES.UPLOAD_FAILED);
  }
}

/**
 * Upload multiple images to generic folder (for pre-upload before collection creation)
 * @param buffers - Array of image file buffers
 * @param folder - Cloudinary folder path
 * @returns Upload result with all image metadata
 */
export async function uploadImagesToFolder(
  buffers: Buffer[],
  folder: string
): Promise<UploadResult> {
  try {
    if (!buffers || buffers.length === 0) {
      throw ApiError.badRequest(UPLOAD_ERROR_MESSAGES.NO_FILES);
    }

    const images = await cloudinaryGateway.uploadMultipleImages(buffers, folder);

    const totalSize = buffers.reduce((sum, buf) => sum + buf.length, 0);

    return {
      success: true,
      images,
      uploadedAt: new Date().toISOString(),
      totalSize,
    };
  } catch (error) {
    console.error('Error uploading images:', error);
    throw ApiError.internal(UPLOAD_ERROR_MESSAGES.UPLOAD_FAILED);
  }
}

/**
 * Delete image by public ID
 * @param publicId - Cloudinary public ID
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    if (!publicId || publicId.trim().length === 0) {
      throw ApiError.badRequest(UPLOAD_ERROR_MESSAGES.INVALID_PUBLIC_ID);
    }

    await cloudinaryGateway.deleteImage(publicId);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw ApiError.internal(UPLOAD_ERROR_MESSAGES.DELETE_FAILED);
  }
}

/**
 * Delete multiple images by public IDs
 * @param publicIds - Array of Cloudinary public IDs
 */
export async function deleteImages(publicIds: string[]): Promise<void> {
  try {
    if (!publicIds || publicIds.length === 0) {
      return;
    }

    const validPublicIds = publicIds.filter((id) => id && id.trim().length > 0);
    if (validPublicIds.length === 0) {
      return;
    }

    await cloudinaryGateway.deleteMultipleImages(validPublicIds);
  } catch (error) {
    console.error('Error deleting images:', error);
    throw ApiError.internal(UPLOAD_ERROR_MESSAGES.DELETE_FAILED);
  }
}

/**
 * Update menu item with new image and delete old if exists
 * @param menuItemId - Menu item ID
 * @param newImageBuffer - New image buffer
 * @param oldPublicId - Old image public ID (for cleanup)
 * @returns Updated image metadata
 */
export async function updateMenuItemImage(
  menuItemId: number,
  newImageBuffer: Buffer,
  oldPublicId?: string
): Promise<SingleImageUploadResult> {
  try {
    // Upload new image
    const newImage = await cloudinaryGateway.uploadSingleImage(
      newImageBuffer,
      'moorhall/menu-items'
    );

    // Update in database
    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        imageUrl: newImage.secure_url,
        imagePublicId: newImage.public_id,
      },
    });

    // Delete old image if public_id is provided
    if (oldPublicId) {
      try {
        await cloudinaryGateway.deleteImage(oldPublicId);
      } catch (deleteError) {
        console.warn('Failed to delete old image:', deleteError);
        // Don't throw - the new image is already uploaded
      }
    }

    return {
      success: true,
      image: newImage,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error updating menu item image:', error);
    throw ApiError.internal(UPLOAD_ERROR_MESSAGES.UPLOAD_FAILED);
  }
}

export default {
  uploadMenuItemImage,
  uploadGalleryImages,
  uploadCateringImages,
  uploadServiceItemImage,
  uploadImageToFolder,
  uploadImagesToFolder,
  deleteImage,
  deleteImages,
  updateMenuItemImage,
};
