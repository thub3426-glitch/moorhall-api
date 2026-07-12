import { Router } from 'express';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import activityRoutes from './activity.routes.js';
import notificationRoutes from './notification.routes.js';
import orderRoutes from './order.routes.js';
import categoryRoutes from './category.routes.js';
import menuItemRoutes from './menuItem.routes.js';
import publicMenuItemRoutes from './publicMenuItems.routes.js';
import heroRoutes from './hero.routes.js';
import customerRoutes from './customer.routes.js';
import webhookRoutes from './webhook.routes.js';
import serviceItemRoutes from './serviceItem.routes.js';
import contentRoutes from './content.routes.js';
import settingsRoutes from './settings.routes.js';
import reportRoutes from './report.routes.js';
import reservationRoutes from './reservation.routes.js';
import cateringRoutes from './catering.routes.js';
import eventRoutes from './event.routes.js';
import paymentRoutes from './payment.routes.js';
import emailRoutes from './email.routes.js';
import promotionRoutes from './promotion.routes.js';
import * as serviceItemController from '../controllers/serviceItem.controller.js';

import * as reservationController from '../controllers/reservation.controller';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API v1 is working 🚀',
  });
});

// Public guest reservation endpoint
router.post('/reservations/guest', reservationController.createGuestReservation);

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/activities', activityRoutes);
router.use('/admin/notifications', notificationRoutes);
router.use('/orders', orderRoutes);
router.use('/admin/categories', categoryRoutes);
router.use('/admin/menu-items', menuItemRoutes);
router.use('/menu-items', publicMenuItemRoutes);
router.use('/hero', heroRoutes);
router.use('/admin/customers', customerRoutes);
router.use('/admin/service-items', serviceItemRoutes);
router.get('/services/featured', serviceItemController.getPublicFeaturedServices);
router.use('/admin/content', contentRoutes);
router.use('/admin/settings', settingsRoutes);
router.use('/admin/reports', reportRoutes);
router.use('/admin/reservations', reservationRoutes);
router.use('/catering', cateringRoutes);
router.use('/events', eventRoutes);
router.use('/admin/payments', paymentRoutes);
router.use('/admin/promotions', promotionRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/emails', emailRoutes);

export default router;
