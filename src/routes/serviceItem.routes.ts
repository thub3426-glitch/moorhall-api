import { Router } from 'express';
import * as serviceItemController from '../controllers/serviceItem.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', serviceItemController.createServiceItem);
router.get('/', serviceItemController.getServiceItems);
router.get('/:id', serviceItemController.getServiceItemById);
router.patch('/:id', serviceItemController.updateServiceItem);
router.patch('/:id/toggle', serviceItemController.toggleServiceStatus);
router.delete('/:id', serviceItemController.deleteServiceItem);

export default router;
