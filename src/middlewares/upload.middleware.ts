import { Request, Response, NextFunction } from 'express';
import multer, { Multer, memoryStorage, FileFilterCallback } from 'multer';
import ApiError from '../utils/apiError.js';
import type { UploadValidationOptions } from '../types/upload.types.js';
import { DEFAULT_UPLOAD_VALIDATION, UPLOAD_ERROR_MESSAGES } from '../types/upload.types.js';

/**
 * Custom Express Request type with files
 */
export interface UploadRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  file?: Express.Multer.File;
}

/**
 * Create multer instance with memory storage and file validation
 * @param options - Upload validation options
 * @returns Configured multer instance
 */
export function createMulterInstance(options: UploadValidationOptions = DEFAULT_UPLOAD_VALIDATION): Multer {
  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    // Validate MIME type
    if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        ApiError.badRequest(UPLOAD_ERROR_MESSAGES.INVALID_MIME_TYPE) as any,
        false
      );
    }

    cb(null, true);
  };

  return multer({
    storage: memoryStorage(),
    fileFilter,
    limits: {
      fileSize: options.maxFileSize || DEFAULT_UPLOAD_VALIDATION.maxFileSize,
      files: options.maxFiles || DEFAULT_UPLOAD_VALIDATION.maxFiles,
    },
  });
}

/**
 * Middleware for uploading single image
 * @param options - Upload validation options
 */
export function uploadSingleImageMiddleware(
  options: UploadValidationOptions = DEFAULT_UPLOAD_VALIDATION
) {
  const multerInstance = createMulterInstance(options);
  return multerInstance.single('image');
}

/**
 * Middleware for uploading multiple images
 * @param options - Upload validation options
 */
export function uploadMultipleImagesMiddleware(
  options: UploadValidationOptions = DEFAULT_UPLOAD_VALIDATION
) {
  const multerInstance = createMulterInstance(options);
  return multerInstance.array('images', options.maxFiles || DEFAULT_UPLOAD_VALIDATION.maxFiles);
}

/**
 * Validate uploaded files
 * @param req - Express request
 * @param requireFiles - Whether files are required
 * @throws ApiError if validation fails
 */
export function validateUploadedFiles(req: UploadRequest, requireFiles: boolean = true): void {
  // Get all files from request
  let allFiles: Express.Multer.File[] = [];
  
  if (req.file) {
    allFiles.push(req.file);
  }
  
  if (req.files) {
    if (Array.isArray(req.files)) {
      allFiles.push(...req.files);
    } else {
      // Object format: { [fieldname]: File[] }
      allFiles.push(...Object.values(req.files).flat());
    }
  }
  
  // Check if files are required
  if (requireFiles && allFiles.length === 0) {
    throw ApiError.badRequest(UPLOAD_ERROR_MESSAGES.NO_FILES);
  }

  // Validate file sizes
  const maxFileSize = DEFAULT_UPLOAD_VALIDATION.maxFileSize || 5 * 1024 * 1024;
  for (const file of allFiles) {
    if (file.size > maxFileSize) {
      throw ApiError.badRequest(UPLOAD_ERROR_MESSAGES.FILE_TOO_LARGE);
    }
  }
}

/**
 * Extract file buffers from request
 * @param req - Express request
 * @returns Array of file buffers
 */
export function extractFileBuffers(req: UploadRequest): Buffer[] {
  let files: Express.Multer.File[] = [];
  
  if (req.files) {
    if (Array.isArray(req.files)) {
      files = req.files;
    } else {
      // Handle multer object format: { [fieldname]: File[] }
      files = Object.values(req.files).flat();
    }
  } else if (req.file) {
    files = [req.file];
  }
  
  return files.map((file) => file.buffer);
}

/**
 * Extract single file buffer from request
 * @param req - Express request
 * @returns File buffer or undefined
 */
export function extractSingleFileBuffer(req: UploadRequest): Buffer | undefined {
  if (req.file) {
    return req.file.buffer;
  }
  
  if (req.files) {
    let files: Express.Multer.File[] = [];
    if (Array.isArray(req.files)) {
      files = req.files;
    } else {
      files = Object.values(req.files).flat();
    }
    return files.length > 0 ? files[0].buffer : undefined;
  }
  
  return undefined;
}



/**
 * Multer error handler middleware
 */
export function handleMulterError(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!err) return next();

  if (err.code === 'LIMIT_FILE_SIZE') {
    return next(ApiError.badRequest(UPLOAD_ERROR_MESSAGES.FILE_TOO_LARGE));
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const maxFiles = DEFAULT_UPLOAD_VALIDATION.maxFiles || 10;
    return next(
      ApiError.badRequest(UPLOAD_ERROR_MESSAGES.TOO_MANY_FILES.replace('{max}', String(maxFiles)))
    );
  }

  if (err.code === 'LIMIT_PART_COUNT') {
    return next(ApiError.badRequest('Too many parts'));
  }

  // Pass other errors to next middleware
  next(err);
}

export default {
  uploadSingleImageMiddleware,
  uploadMultipleImagesMiddleware,
  validateUploadedFiles,
  extractFileBuffers,
  extractSingleFileBuffer,
  handleMulterError,
};
