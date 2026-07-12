/**
 * Email Module — Main Entry Point
 *
 * Re-exports all email-related functionality from a single import point.
 * Use this to access the email service, types, and utilities.
 *
 * Usage:
 *   import emailModule from '../emails';
 *   const { default: emailService, EmailService } = emailModule;
 */

// Service
export { default as emailService, EmailService } from './services/email.service';

// Types
export type {
  EmailAddress,
  EmailAttachment,
  EmailSendResult,
  EmailError,
  EmailProvider,
  EmailProviderConfig,
  EmailProviderHealth,
  TemplateVariables,
  EmailTemplate,
  ForgotPasswordEmailData,
  ResetSuccessEmailData,
  ContactEmailData,
  AutoReplyEmailData,
  WelcomeEmailData,
  EmailOptions,
  EmailQueueItem,
  EmailServiceConfig,
} from './types/email.types';

// Templates
export { getTemplate, getAvailableTemplates } from './templates/index';

// Utilities
export { renderTemplate, generateMessageId, sanitizeSubject, isValidEmail, normalizeEmail } from './utils/template-renderer';
export {
  contactEmailSchema,
  welcomeEmailSchema,
  sendForgotPasswordSchema,
  type ContactEmailInput,
  type WelcomeEmailInput,
  type SendForgotPasswordInput,
  sanitizeEmailAddress,
  validateEmailStrict,
  sanitizeInput,
} from './utils/email-validators';

// Transporter Manager
export { default as transporterManager } from './config/transporter.config';