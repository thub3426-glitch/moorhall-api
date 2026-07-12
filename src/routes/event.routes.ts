import { Router } from 'express';
import * as eventController from '../controllers/event.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Public endpoint for guest event bookings
router.post('/guest', eventController.createGuestEvent);

// Protected admin endpoints
router.use(protect);

router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.patch('/:id/status', eventController.updateEventStatus);
router.delete('/:id', eventController.deleteEvent);

export default router;