import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', reportController.getReports);
router.get('/revenue', reportController.getRevenueStats);

export default router;