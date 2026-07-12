import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { registerSchema, loginSchema, changePasswordSchema, refreshTokenSchema, updateProfileSchema, forgotPasswordSchema, resetPasswordSchema } from '../types/auth.types.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many registration attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many password reset attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerRateLimiter, validate(registerSchema), authController.register);

router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);

router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.getMe);

router.patch('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

router.patch('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);

router.post('/forgot-password', forgotPasswordRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

router.patch('/suspend/:id', authenticate, requireAdmin, authController.suspendAdmin);

router.patch('/activate/:id', authenticate, requireAdmin, authController.activateAdmin);

export default router;
