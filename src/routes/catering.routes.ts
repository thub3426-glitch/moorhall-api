import { Router } from 'express';
import * as cateringController from '../controllers/catering.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Public endpoint for guest catering requests
router.post('/guest', cateringController.createGuestCateringRequest);

// Protected admin endpoints
router.use(protect);

router.get('/', cateringController.getCateringRequests);
router.get('/:id', cateringController.getCateringRequestById);
router.patch('/:id/status', cateringController.updateCateringStatus);
router.delete('/:id', cateringController.deleteCateringRequest);

export default router;