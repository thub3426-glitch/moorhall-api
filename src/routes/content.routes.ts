import { Router } from 'express';
import * as contentController from '../controllers/content.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/blocks', contentController.getContentBlocks);
router.patch('/blocks/:id', contentController.updateContentBlock);
router.get('/promo-banners', contentController.getPromoBanners);
router.patch('/promo-banners/:id', contentController.updatePromoBanner);

export default router;
