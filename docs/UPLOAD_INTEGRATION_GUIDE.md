# Image Upload Integration Guide

## Frontend Implementation Examples

### React Hook for Image Upload

```typescript
// hooks/useImageUpload.ts
import { useState } from 'react';

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    image?: {
      secure_url: string;
      public_id: string;
      width?: number;
      height?: number;
    };
    images?: Array<{
      secure_url: string;
      public_id: string;
      width?: number;
      height?: number;
    }>;
    uploadedAt: string;
    totalSize?: number;
  };
}

interface UseImageUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadSingleImage = async (file: File, endpoint: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/v1/uploads${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      options.onSuccess?.(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadMultipleImages = async (files: File[], endpoint: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch(`/api/v1/uploads${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      options.onSuccess?.(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (publicId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/uploads/images/${publicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Delete failed');
      }

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadSingleImage,
    uploadMultipleImages,
    deleteImage,
    isLoading,
    error,
  };
}
```

---

## Component Examples

### Single Image Upload for Menu Item

```typescript
// components/MenuItemImageUpload.tsx
import React, { useRef } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';

interface MenuItemImageUploadProps {
  menuItemId: number;
  onUploadSuccess?: (imageUrl: string) => void;
}

export function MenuItemImageUpload({ menuItemId, onUploadSuccess }: MenuItemImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const { uploadSingleImage, isLoading, error } = useImageUpload({
    onSuccess: (response) => {
      const imageUrl = response.data.image?.secure_url;
      setPreview(imageUrl || null);
      onUploadSuccess?.(imageUrl!);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    try {
      await uploadSingleImage(file, `/menu-items/${menuItemId}/image`);
    } catch (err) {
      console.error('Upload failed:', err);
      setPreview(null);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500"
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="h-32 w-32 object-cover mx-auto" />
        ) : (
          <div>
            <p className="text-gray-600">Click to upload image</p>
            <p className="text-sm text-gray-500">Max 5MB • JPEG, PNG, WebP, GIF</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isLoading}
          className="hidden"
        />
      </div>

      {isLoading && <p className="text-blue-600">Uploading...</p>}
      {error && <p className="text-red-600">{error.message}</p>}
    </div>
  );
}
```

### Multiple Images Upload for Gallery

```typescript
// components/GalleryImageUpload.tsx
import React, { useRef } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';

interface ImagePreview {
  file: File;
  preview: string;
  publicId?: string;
  secure_url?: string;
}

export function GalleryImageUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = React.useState<ImagePreview[]>([]);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const { uploadMultipleImages, deleteImage, isLoading, error } = useImageUpload({
    onSuccess: (response) => {
      // Update previews with uploaded URLs and public IDs
      setPreviews((prev) =>
        prev.map((p, i) => ({
          ...p,
          secure_url: response.data.images?.[i]?.secure_url,
          publicId: response.data.images?.[i]?.public_id,
        }))
      );
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviews((prev) => [
          ...prev,
          {
            file,
            preview: event.target?.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      await uploadMultipleImages(selectedFiles, '/gallery');
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleRemove = async (index: number) => {
    const preview = previews[index];
    
    // Delete from Cloudinary if already uploaded
    if (preview.publicId) {
      try {
        await deleteImage(preview.publicId);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }

    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-gray-600">Click to upload images</p>
        <p className="text-sm text-gray-500">Max 10 files • 5MB each</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isLoading}
          className="hidden"
        />
      </div>

      {previews.length > 0 && (
        <div>
          <div className="grid grid-cols-4 gap-4">
            {previews.map((p, i) => (
              <div key={i} className="relative">
                <img
                  src={p.preview}
                  alt={`Preview ${i}`}
                  className="w-full h-24 object-cover rounded"
                />
                <button
                  onClick={() => handleRemove(i)}
                  disabled={isLoading}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpload}
            disabled={isLoading}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            {isLoading ? 'Uploading...' : 'Upload All'}
          </button>
        </div>
      )}

      {error && <p className="text-red-600">{error.message}</p>}
    </div>
  );
}
```

### Pre-upload Pattern (Upload Before Item Creation)

```typescript
// components/MenuItemForm.tsx
import React, { useState } from 'react';
import { useImageUpload, UploadResponse } from '@/hooks/useImageUpload';

interface MenuItemFormData {
  name: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
  images?: Array<{ secure_url: string; public_id: string }>;
}

export function MenuItemForm() {
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    price: 0,
    categoryId: 1,
  });

  const [uploadedImages, setUploadedImages] = useState<
    Array<{ secure_url: string; public_id: string }>
  >([]);

  const { uploadMultipleImages, isLoading } = useImageUpload({
    onSuccess: (response) => {
      // Store uploaded image metadata
      const images = response.data.images || [];
      setUploadedImages(images);
      
      // Set first image as main image
      if (images.length > 0) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: images[0].secure_url,
        }));
      }
    },
  });

  const handleImageUpload = async (files: File[]) => {
    await uploadMultipleImages(files, '/pre-upload-multiple');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Submit form with uploaded image data
    const response = await fetch('/api/v1/admin/menu-items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...formData,
        images: uploadedImages, // Use pre-uploaded image metadata
      }),
    });

    if (response.ok) {
      // Reset form
      setFormData({ name: '', price: 0, categoryId: 1 });
      setUploadedImages([]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Item Name"
        value={formData.name}
        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        required
      />

      <input
        type="number"
        placeholder="Price"
        value={formData.price}
        onChange={(e) => setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) }))}
        required
      />

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleImageUpload(Array.from(e.target.files || []))}
        disabled={isLoading}
      />

      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold">Uploaded Images: {uploadedImages.length}</p>
          <div className="grid grid-cols-4 gap-2">
            {uploadedImages.map((img, i) => (
              <img key={i} src={img.secure_url} alt={`Uploaded ${i}`} className="h-20 w-20 object-cover rounded" />
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Create Menu Item
      </button>
    </form>
  );
}
```

---

## Utility Functions

### Image Validation Utility

```typescript
// utils/imageValidation.ts
export const IMAGE_VALIDATION = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_EXTENSIONS: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
};

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > IMAGE_VALIDATION.MAX_FILE_SIZE) {
    return { valid: false, error: 'File is too large. Maximum size is 5MB' };
  }

  // Check MIME type
  if (!IMAGE_VALIDATION.ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' };
  }

  // Check extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !IMAGE_VALIDATION.ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Invalid file extension' };
  }

  return { valid: true };
}

export function validateImageFiles(files: File[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (files.length === 0) {
    errors.push('No files provided');
  }

  if (files.length > 10) {
    errors.push('Too many files. Maximum is 10 files');
  }

  files.forEach((file, index) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      errors.push(`File ${index + 1}: ${validation.error}`);
    }
  });

  return { valid: errors.length === 0, errors };
}
```

---

## Error Handling Strategies

### User-Friendly Error Messages

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  'No files provided for upload': 'Please select an image to upload',
  'Invalid file type': 'Please upload a valid image format (JPEG, PNG, WebP, or GIF)',
  'File is too large': 'Your image is too large. Please resize it to under 5MB',
  'Too many files': 'Please upload no more than 10 images at a time',
  'Cloudinary not configured': 'Image upload service is currently unavailable. Please try again later',
};

export function getUserFriendlyErrorMessage(errorMessage: string): string {
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return 'An error occurred during upload. Please try again';
}
```

---

## Best Practices

1. **Always Store Public IDs**: When using pre-upload, store both `secure_url` and `public_id` for future cleanup
2. **Validate Before Upload**: Check file size and type on client before sending
3. **Provide Feedback**: Show loading indicators and success/error messages
4. **Batch Operations**: Use pre-upload endpoints when uploading multiple images
5. **Cleanup**: Delete old images when updating to prevent orphaned files
6. **Error Handling**: Show user-friendly error messages
7. **Progress Tracking**: For multiple uploads, track individual file progress

---

## Performance Tips

1. **Image Compression**: Compress images before uploading to reduce bandwidth
2. **Lazy Loading**: Load images lazily in galleries and product lists
3. **Thumbnails**: Request thumbnails instead of full-size images when appropriate
4. **Caching**: Cache upload responses to avoid re-uploading identical images
5. **Batch Uploads**: Group uploads into batches for better performance

---

## Security Reminders

- Always validate file types on the server (client-side validation can be bypassed)
- Use HTTPS for all upload requests
- Implement rate limiting for upload endpoints
- Store sensitive data (public_id) securely
- Never expose Cloudinary API keys in frontend code
