import { Request, Response } from 'express';
import * as uploadService from '../services/upload.service.js';
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { extractFileBuffers, extractSingleFileBuffer, validateUploadedFiles, UploadRequest } from '../middlewares/upload.middleware.js';
import { UploadFolder } from '../types/upload.types.js';

/**
 * Upload single image for menu item
 * POST /api/v1/uploads/menu-items/:id/image
 */
export const uploadMenuItemImage = asyncHandler(async (req: UploadRequest, res: Response) => {
  const menuItemId = parseInt(req.params.id as string);
  
  validateUploadedFiles(req, true);
  const buffer = extractSingleFileBuffer(req);

  if (!buffer) {
    return res.status(400).json(apiResponse.badRequest('No file provided'));
  }

  const result = await uploadService.uploadMenuItemImage(buffer, menuItemId);
  return res.status(201).json(apiResponse.created(result, 'Menu item image uploaded successfully'));
});

/**
 * Upload multiple images for menu item gallery
 * POST /api/v1/uploads/menu-items/:id/images
 */
export const uploadMenuItemImages = asyncHandler(async (req: UploadRequest, res: Response) => {
  const menuItemId = parseInt(req.params.id as string);

  validateUploadedFiles(req, true);
  const buffers = extractFileBuffers(req);

  if (buffers.length === 0) {
    return res.status(400).json(apiResponse.badRequest('No files provided'));
  }

  const result = await uploadService.uploadImagesToFolder(buffers, UploadFolder.MENU_ITEMS);
  return res.status(201).json(apiResponse.created(result, 'Menu item images uploaded successfully'));
});

/**
 * Upload images for gallery
 * POST /api/v1/uploads/gallery
 */
export const uploadGalleryImages = asyncHandler(async (req: UploadRequest, res: Response) => {
  const { title } = req.body;

  validateUploadedFiles(req, true);
  const buffers = extractFileBuffers(req);

  if (buffers.length === 0) {
    return res.status(400).json(apiResponse.badRequest('No files provided'));
  }

  const result = await uploadService.uploadGalleryImages(buffers, title);
  return res.status(201).json(apiResponse.created(result, 'Gallery images uploaded successfully'));
});

/**
 * Upload images for catering event
 * POST /api/v1/uploads/catering/:id/images
 */
export const uploadCateringImages = asyncHandler(async (req: UploadRequest, res: Response) => {
  const cateringRequestId = parseInt(req.params.id as string);

  validateUploadedFiles(req, true);
  const buffers = extractFileBuffers(req);

  if (buffers.length === 0) {
    return res.status(400).json(apiResponse.badRequest('No files provided'));
  }

  const result = await uploadService.uploadCateringImages(buffers, cateringRequestId);
  return res.status(201).json(apiResponse.created(result, 'Catering images uploaded successfully'));
});

/**
 * Upload image for service item
 * POST /api/v1/uploads/service-items/:id/image
 */
export const uploadServiceItemImage = asyncHandler(async (req: UploadRequest, res: Response) => {
  const serviceItemId = parseInt(req.params.id as string);

  validateUploadedFiles(req, true);
  const buffer = extractSingleFileBuffer(req);

  if (!buffer) {
    return res.status(400).json(apiResponse.badRequest('No file provided'));
  }

  const result = await uploadService.uploadServiceItemImage(buffer, serviceItemId);
  return res.status(201).json(apiResponse.created(result, 'Service item image uploaded successfully'));
});

/**
 * Pre-upload single image (returns URL without linking to any item)
 * POST /api/v1/uploads/pre-upload
 * Used for uploading images before creating the item
 */
export const preUploadImage = asyncHandler(async (req: UploadRequest, res: Response) => {
  const { folder = UploadFolder.MENU_ITEMS } = req.body;

  validateUploadedFiles(req, true);
  const buffer = extractSingleFileBuffer(req);

  if (!buffer) {
    return res.status(400).json(apiResponse.badRequest('No file provided'));
  }

  const result = await uploadService.uploadImageToFolder(buffer, folder);
  return res.status(201).json(apiResponse.created(result, 'Image uploaded successfully'));
});

/**
 * Pre-upload multiple images (returns URLs without linking to any item)
 * POST /api/v1/uploads/pre-upload-multiple
 * Used for uploading images before creating the collection
 */
export const preUploadMultipleImages = asyncHandler(async (req: UploadRequest, res: Response) => {
  const { folder = UploadFolder.MENU_ITEMS } = req.body;

  validateUploadedFiles(req, true);
  const buffers = extractFileBuffers(req);

  if (buffers.length === 0) {
    return res.status(400).json(apiResponse.badRequest('No files provided'));
  }

  const result = await uploadService.uploadImagesToFolder(buffers, folder);
  return res.status(201).json(apiResponse.created(result, 'Images uploaded successfully'));
});

/**
 * Delete image by public ID
 * DELETE /api/v1/uploads/images/:publicId
 */
export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = req.params;

  await uploadService.deleteImage(publicId as string);
  return res.json(apiResponse.success(null, 'Image deleted successfully'));
});

/**
 * Delete multiple images
 * POST /api/v1/uploads/images/delete-multiple
 */
export const deleteMultipleImages = asyncHandler(async (req: Request, res: Response) => {
  const { publicIds } = req.body;

  if (!publicIds || !Array.isArray(publicIds)) {
    return res.status(400).json(apiResponse.badRequest('publicIds array is required'));
  }

  await uploadService.deleteImages(publicIds);
  return res.json(apiResponse.success(null, 'Images deleted successfully'));
});

export default {
  uploadMenuItemImage,
  uploadMenuItemImages,
  uploadGalleryImages,
  uploadCateringImages,
  uploadServiceItemImage,
  preUploadImage,
  preUploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
};
