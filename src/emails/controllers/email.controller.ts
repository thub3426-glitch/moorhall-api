import { z } from 'zod';
import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import apiResponse from '../../utils/apiResponse';
import emailService from '../services/email.service';
import {
  contactEmailSchema,
  type ContactEmailInput,
  welcomeEmailSchema,
  type WelcomeEmailInput,
  sendForgotPasswordSchema,
  type SendForgotPasswordInput,
} from '../utils/email-validators';
import { sanitizeInput } from '../utils/email-validators';
import ApiError from '../../utils/apiError';

export const sendContactEmail = asyncHandler(async (req: Request, res: Response) => {
  const validation = contactEmailSchema.safeParse(req.body);

  if (!validation.success) {
    const errors = validation.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json(apiResponse.badRequest('Validation failed', errors));
  }

  const data: ContactEmailInput = validation.data;

  const sanitizedMessage = sanitizeInput(data.message, 5000);
  const sanitizedSubject = sanitizeInput(data.subject, 200);
  const sanitizedName = sanitizeInput(data.fullName, 100);

  const adminEmailsRaw = process.env.ADMIN_EMAILS || process.env.EMAIL_TO || '';
  const adminEmails = adminEmailsRaw
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  if (adminEmails.length === 0) {
    throw new ApiError(500, 'No admin email addresses configured');
  }

  const contactResult = await emailService.sendContactEmail({
    fromName: sanitizedName,
    fromEmail: data.email,
    fromPhone: data.phone,
    subject: sanitizedSubject,
    message: sanitizedMessage,
    timestamp: new Date().toISOString(),
    adminEmails,
  });

  const autoReplyMessage = process.env.AUTO_REPLY_MESSAGE || 'Thank you for contacting us. Our team will review your message and get back to you within 1-2 business days.';

  await emailService.sendAutoReplyEmail({
    to: data.email,
    toName: sanitizedName,
    originalSubject: sanitizedSubject,
    originalMessage: sanitizedMessage,
    replyMessage: autoReplyMessage,
    timestamp: new Date().toISOString(),
  }).catch((error) => {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Email] Auto-reply failed:', msg);
  });

  res.status(200).json(apiResponse.success(
    { messageId: contactResult.messageId },
    'Your message has been sent successfully. A confirmation email has been sent to your inbox.'
  ));
});

export const sendWelcomeEmail = asyncHandler(async (req: Request, res: Response) => {
  const validation = welcomeEmailSchema.safeParse(req.body);

  if (!validation.success) {
    const errors = validation.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json(apiResponse.badRequest('Validation failed', errors));
  }

  const data: WelcomeEmailInput = validation.data;

  const sanitizedName = sanitizeInput(data.fullName, 100);

  const loginLink = `${process.env.FRONTEND_URL || 'https://moorhall.com'}/login`;

  const result = await emailService.sendWelcomeEmail({
    to: data.email,
    toName: sanitizedName,
    loginLink,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(apiResponse.success(
    { messageId: result.messageId },
    'Welcome email sent successfully'
  ));
});

export const sendForgotPasswordEmail = asyncHandler(async (req: Request, res: Response) => {
  const validation = sendForgotPasswordSchema.safeParse(req.body);

  if (!validation.success) {
    const errors = validation.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json(apiResponse.badRequest('Validation failed', errors));
  }

  const { email } = validation.data;

  const resetLink = `${process.env.FRONTEND_URL || 'https://moorhall.com'}/reset-password?token={resetToken}`;
  const expiryTime = '1 hour';

  const result = await emailService.sendForgotPasswordEmail({
    to: email,
    toName: email.split('@')[0],
    resetLink,
    expiryTime,
    requestIp: req.ip || (req.headers['x-forwarded-for'] as string) || 'Unknown',
    requestTime: new Date().toISOString(),
  });

  res.status(200).json(apiResponse.success(
    { messageId: result.messageId },
    'If an account with that email exists, a password reset link has been sent.'
  ));
});

export const sendResetSuccessEmail = asyncHandler(async (req: Request, res: Response) => {
  const resetSuccessSchema = z.object({
    email: z.string().email('Invalid email address').max(254),
    fullName: z.string().optional().default('User'),
  });

  const validation = resetSuccessSchema.safeParse(req.body);

  if (!validation.success) {
    const errors = validation.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json(apiResponse.badRequest('Validation failed', errors));
  }

  const data = validation.data;
  const sanitizedName = sanitizeInput(data.fullName || 'User', 100);

  const loginLink = `${process.env.FRONTEND_URL || 'https://moorhall.com'}/login`;

  const result = await emailService.sendResetSuccessEmail({
    to: data.email,
    toName: sanitizedName,
    loginLink,
    timestamp: new Date().toISOString(),
  });

  res.status(200).json(apiResponse.success(
    { messageId: result.messageId },
    'Password reset confirmation email sent successfully'
  ));
});

export const checkEmailHealth = asyncHandler(async (req: Request, res: Response) => {
  const health = await emailService.healthCheck();

  res.status(200).json(apiResponse.success(health, 'Email health check completed'));
});