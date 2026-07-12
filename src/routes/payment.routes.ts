import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', paymentController.getPayments);
router.get('/:id', paymentController.getPaymentById);
router.post('/:id/verify', paymentController.verifyPayment);

export default router;