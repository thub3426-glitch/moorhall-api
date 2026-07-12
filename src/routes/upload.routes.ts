import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { uploadSingleImageMiddleware, uploadMultipleImagesMiddleware, handleMulterError } from '../middlewares/upload.middleware.js';
import { UploadValidationOptions, DEFAULT_UPLOAD_VALIDATION } from '../types/upload.types.js';

const router = Router();

/**
 * Apply authentication to all upload routes
 * Only authenticated users can upload images
 */
router.use(protect);

/**
 * Default validation options
 */
const defaultValidation: UploadValidationOptions = DEFAULT_UPLOAD_VALIDATION;

/**
 * Menu Item Image Uploads
 */

/**
 * POST /api/v1/uploads/menu-items/:id/image
 * Upload single image for a menu item (replaces existing image)
 * @param id - Menu item ID
 */
router.post(
  '/menu-items/:id/image',
  uploadSingleImageMiddleware(defaultValidation),
  handleMulterError,
  uploadController.uploadMenuItemImage
);

/**
 * POST /api/v1/uploads/menu-items/:id/images
 * Upload multiple images for menu item gallery (stores in images array)
 * @param id - Menu item ID
 */
router.post(
  '/menu-items/:id/images',
  uploadMultipleImagesMiddleware(defaultValidation),
  handleMulterError,
  uploadController.uploadMenuItemImages
);

/**
 * Gallery Image Uploads
 */

/**
 * POST /api/v1/uploads/gallery
 * Upload multiple images to gallery
 * @body title - Optional gallery title
 */
router.post(
  '/gallery',
  uploadMultipleImagesMiddleware(defaultValidation),
  handleMulterError,
  uploadController.uploadGalleryImages
);

/**
 * Catering Event Image Uploads
 */

/**
 * POST /api/v1/uploads/catering/:id/images
 * Upload multiple images for catering event
 * @param id - Catering request ID
 */
router.post(
  '/catering/:id/images',
  uploadMultipleImagesMiddleware(defaultValidation),
  handleMulterError,
  uploadController.uploadCateringImages
);

/**
 * Service Item Image Uploads
 */

/**
 * POST /api/v1/uploads/service-items/:id/image
 * Upload single image for a service item
 * @param id - Service item ID
 */
router.post(
  '/service-items/:id/image',
  uploadSingleImageMiddleware(defaultValidation),
  handleMulterError,
  uploadController.uploadServiceItemImage
);

/**
 * Pre-upload Endpoints (for uploading before item creation)
 */

/**
 * POST /api/v1/uploads/pre-upload
 * Pre-upload single image without linking to any item
 * Returns secure_url and public_id for storing in client before item creation
 * @body folder - Optional folder path (default: moorhall/menu-items)
 */
router.post(
  '/pre-upload',
  uploadSingleImageMiddleware(defaultValidation),
  handleMulterError,
  uploadController.preUploadImage
);

/**
 * POST /api/v1/uploads/pre-upload-multiple
 * Pre-upload multiple images without linking to any item
 * Returns secure_url and public_id for each image for storing in client before collection creation
 * @body folder - Optional folder path (default: moorhall/menu-items)
 */
router.post(
  '/pre-upload-multiple',
  uploadMultipleImagesMiddleware(defaultValidation),
  handleMulterError,
  uploadController.preUploadMultipleImages
);

/**
 * Delete Endpoints
 */

/**
 * DELETE /api/v1/uploads/images/:publicId
 * Delete single image by public ID
 * @param publicId - Cloudinary public ID
 */
router.delete(
  '/images/:publicId',
  uploadController.deleteImage
);

/**
 * POST /api/v1/uploads/images/delete-multiple
 * Delete multiple images by public IDs
 * @body publicIds - Array of Cloudinary public IDs
 */
router.post(
  '/images/delete-multiple',
  uploadController.deleteMultipleImages
);

export default router;
