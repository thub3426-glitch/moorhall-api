import { Router } from 'express';
import * as promotionController from '../controllers/promotion.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/public', promotionController.getPublicPromotions);



router.post('/',protect, promotionController.createPromotion);
router.get('/',protect, promotionController.getAllPromotions);
router.get('/:id',protect, promotionController.getPromotionById);
router.patch('/:id',protect, promotionController.updatePromotion);
router.delete('/:id',protect, promotionController.deletePromotion);
router.patch('/:id/toggle',protect, promotionController.togglePromotionStatus);

export default router;
