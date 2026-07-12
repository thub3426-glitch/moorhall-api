/**
 * Email Routes
 *
 * All email-related API endpoints. Protected by appropriate middleware
 * and rate limiting to prevent abuse.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as emailController from '../emails/controllers/email.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  contactEmailSchema,
  welcomeEmailSchema,
  sendForgotPasswordSchema,
} from '../emails/utils/email-validators';

const router = Router();

// ─── Rate Limiters ────────────────────────────────────────────────────

const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many contact form submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const welcomeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many email requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalEmailRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many email requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public Routes ────────────────────────────────────────────────────

router.post(
  '/contact',
  contactRateLimiter,
  validate(contactEmailSchema),
  emailController.sendContactEmail
);

router.post(
  '/welcome',
  welcomeRateLimiter,
  validate(welcomeEmailSchema),
  emailController.sendWelcomeEmail
);

// ─── Authenticated Routes ─────────────────────────────────────────────

router.post(
  '/forgot-password',
  generalEmailRateLimiter,
  validate(sendForgotPasswordSchema),
  emailController.sendForgotPasswordEmail
);

router.post(
  '/reset-success',
  authenticate,
  generalEmailRateLimiter,
  validate(welcomeEmailSchema),
  emailController.sendResetSuccessEmail
);

// ─── Admin Routes ─────────────────────────────────────────────────────

router.get(
  '/health',
  authenticate,
  emailController.checkEmailHealth
);

export default router;