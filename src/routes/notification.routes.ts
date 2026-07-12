import { Router } from 'express';
import {
  getNotifications,
  getNotificationById,
  getNotificationStats,
  resendNotification,
  getOrderNotifications
} from '../controllers/notification.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/stats', getNotificationStats);
router.get('/:id', getNotificationById);
router.post('/:id/resend', resendNotification);
router.get('/order/:orderId', getOrderNotifications);

export default router;
