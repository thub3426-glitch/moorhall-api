import { Router } from 'express';
import orderController from '../controllers/order.controller';
import { protect } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

router.post('/guest', orderController.createGuestOrder);

router.get('/settings/payment', orderController.getPaymentSettings);
router.patch('/settings/payment', protect, authorize('ADMIN'), orderController.setPaymentSettings);

router.get('/', protect, authorize('ADMIN'), orderController.getOrders);
router.get('/:id', protect, authorize('ADMIN'), orderController.getOrderById);
router.patch('/:id/status', protect, authorize('ADMIN'), orderController.updateOrderStatus);
router.patch('/:id/payment-review', protect, authorize('ADMIN'), orderController.reviewPayment);

export default router;
