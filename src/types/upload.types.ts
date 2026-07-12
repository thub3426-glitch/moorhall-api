/**
 * Upload system types and interfaces
 */

export enum UploadFolder {
  MENU_ITEMS = 'moorhall/menu-items',
  GALLERY = 'moorhall/gallery',
  CATERING = 'moorhall/catering-events',
  SERVICE_ITEMS = 'moorhall/service-items',
}

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  resource_type?: string;
}

export interface ImageMetadata {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface UploadResult {
  success: boolean;
  images: ImageMetadata[];
  uploadedAt: string;
  totalSize?: number;
}

export interface SingleImageUploadResult {
  success: boolean;
  image: ImageMetadata;
  uploadedAt: string;
}

export interface DeleteResult {
  success: boolean;
  publicId: string;
  deletedAt: string;
}

export interface UploadValidationOptions {
  maxFileSize?: number; // in bytes
  allowedMimeTypes?: string[];
  maxFiles?: number;
}

export const DEFAULT_UPLOAD_VALIDATION: UploadValidationOptions = {
  maxFileSize: 300 * 1024 * 1024, // 300MB - increased from 5MB for PDF/menu item uploads
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
  maxFiles: 10,
};

export const UPLOAD_ERROR_MESSAGES = {
  NO_FILES: 'No files provided for upload',
  INVALID_MIME_TYPE: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed',
  FILE_TOO_LARGE: 'File is too large. Maximum size is 5MB',
  TOO_MANY_FILES: 'Too many files. Maximum is {max} files',
  UPLOAD_FAILED: 'Failed to upload image to Cloudinary',
  DELETE_FAILED: 'Failed to delete image from Cloudinary',
  INVALID_PUBLIC_ID: 'Invalid public ID provided',
  CLOUDINARY_NOT_CONFIGURED: 'Cloudinary service is not configured',
};
