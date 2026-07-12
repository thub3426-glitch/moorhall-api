import { Router } from 'express';
import { getActivities, getActivityById, getOrderActivities } from '../controllers/activity.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getActivities);
router.get('/:id', getActivityById);
router.get('/order/:orderId', getOrderActivities);

export default router;
