import { Router } from 'express';
import * as heroController from '../controllers/hero.controller';

const router = Router();

// Public hero endpoints — no auth required
router.get('/', heroController.getHeroSection);
router.get('/slides', heroController.getHeroSlides);
router.get('/config', heroController.getHeroConfig);
router.get('/featured', heroController.getFeaturedPromotion);

export default router;
