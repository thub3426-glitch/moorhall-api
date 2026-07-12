import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', settingsController.getSettings);
router.get('/key/:key', settingsController.getSettingByKey);
router.patch('/:id', settingsController.updateSetting);

export default router;