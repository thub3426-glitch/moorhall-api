import { Router } from 'express';
import * as menuItemController from '../controllers/menuItem.controller';

const router = Router();

// Public endpoints — no auth required

// Home page menu (hierarchical with categories)
router.get('/public/home', menuItemController.getHomePageMenu);

// All active categories for navigation
router.get('/public/categories', menuItemController.getPublicCategories);

// Items for a specific category
router.get('/public/categories/:id', menuItemController.getPublicCategoryWithItems);

// Individual menu item
router.get('/:id', menuItemController.getPublicMenuItemById);

// Menu items with optional filters
router.get('/', menuItemController.getPublicMenuItems);

export default router;
