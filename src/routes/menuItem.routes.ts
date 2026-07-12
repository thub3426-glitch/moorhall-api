import { Router, Request, Response } from 'express';
import * as menuItemController from '../controllers/menuItem.controller';
import { protect } from '../middlewares/auth.middleware';
import { uploadMultipleImages } from '../gateways/cloudinary.gateway';
import multer from 'multer';
import asyncHandler from '../utils/asyncHandler';

type UploadedFile = { buffer: Buffer };

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const uploadPdf = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: { fileSize: 300 * 1024 * 1024 }, // 300MB for PDF files
});

router.use(protect);

router.post('/', menuItemController.createMenuItem);
router.get('/', menuItemController.getMenuItems);
router.get('/:id', menuItemController.getMenuItemById);
router.patch('/:id', menuItemController.updateMenuItem);
router.patch('/:id/availability', menuItemController.toggleAvailability);
router.delete('/:id', menuItemController.deleteMenuItem);

router.post('/upload-pdf', uploadPdf.single('pdf'), menuItemController.processMenuPdf);

// Upload multiple images (standalone — no menu item ID required, used for pre-uploading before item creation)
router.post(
  '/images',
  upload.array('images', 10),
  asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files || []) as UploadedFile[];
    console.log('[POST /admin/menu-items/images] incoming request, files count:', files.length);
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    // Validate Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('[POST /admin/menu-items/images] Cloudinary not configured:', {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'set' : 'MISSING',
        apiKey: process.env.CLOUDINARY_API_KEY ? 'set' : 'MISSING',
        apiSecret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'MISSING',
      });
      return res.status(500).json({ error: 'Image upload service is not configured on the server' });
    }

    try {
      const buffers = files.map((file) => file.buffer);
      console.log('[POST /admin/menu-items/images] uploading', buffers.length, 'file(s) to Cloudinary...');
      const urls = await uploadMultipleImages(buffers);
      console.log('[POST /admin/menu-items/images] upload success, urls:', urls);
      res.json({ urls });
    } catch (uploadError) {
      console.error('[POST /admin/menu-items/images] Cloudinary upload error:', uploadError);
      throw uploadError;
    }
  })
);

// Upload multiple images for an existing menu item
router.post(
  '/:id/images',
  upload.array('images', 10),
  asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files || []) as UploadedFile[];
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const buffers = files.map((file) => file.buffer);
    const urls = await uploadMultipleImages(buffers);
    res.json({ urls });
  })
);

export default router;
