/**
 * Email Template Registry
 *
 * Central registry for all email templates. Provides a single point of
 * access for template retrieval and ensures consistent template naming.
 */

import { EmailTemplate } from '../types/email.types';
import { forgotPasswordTemplate } from './forgot-password.template';
import { resetSuccessTemplate } from './reset-success.template';
import { contactEmailTemplate } from './contact.template';
import { autoReplyTemplate } from './auto-reply.template';
import { welcomeTemplate } from './welcome.template';

// Template function map
const templateFunctions: Record<string, (data: any) => string> = {
  forgotPassword: forgotPasswordTemplate,
  resetSuccess: resetSuccessTemplate,
  contact: contactEmailTemplate,
  autoReply: autoReplyTemplate,
  welcome: welcomeTemplate,
};

/**
 * Get a compiled email template by name
 */
export function getTemplate(name: string, data: Record<string, unknown>): EmailTemplate | null {
  const templateFn = templateFunctions[name];
  if (!templateFn) {
    return null;
  }

  const html = templateFn(data as any);

  // Generate plain-text fallback by stripping HTML tags
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract subject from <title> tag
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const subject = titleMatch ? titleMatch[1] : 'Moor Hall';

  return {
    name,
    subject,
    html,
    text,
  };
}

/**
 * List all available template names
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(templateFunctions);
}