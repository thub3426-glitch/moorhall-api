import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', customerController.getCustomers);
router.get('/phone/:phone', customerController.getCustomerByPhone);

export default router;
