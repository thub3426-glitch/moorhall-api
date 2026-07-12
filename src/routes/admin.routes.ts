import { Router } from 'express';
import { getDashboard } from '../controllers/admin.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/dashboard', getDashboard);

export default router;
