/**
 * Contact Form Email Template
 *
 * Sent to admin/company when a user submits the contact form.
 */

import { buildBaseLayout } from './base-layout';
import { ContactEmailData } from '../types/email.types';

export function contactEmailTemplate(data: ContactEmailData): string {
  const { fromName, fromEmail, fromPhone, subject, message, timestamp } = data;

  const phoneSection = fromPhone
    ? `
    <tr>
      <td style="font-size: 12px; color: #888888; padding: 4px 0;">Phone:</td>
      <td style="font-size: 12px; color: #555555; padding: 4px 0;">${fromPhone}</td>
    </tr>`
    : '';

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background-color: #e0e7ff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8L10.5 13L21 3M3 8L10.5 13L12 13.5M3 8L10.5 13L21 3M12 13.5L21 3M12 13.5V17.5C12 18.8807 10.8807 20 9.5 20H4.5C3.11929 20 2 18.8807 2 17.5V15.5C2 14.1193 3.11929 13 4.5 13H9.5L12 13.5Z" stroke="#4338ca" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px;">New Contact Form Submission</h1>
      <p style="font-size: 16px; color: #555555; margin: 0;">You received a new message from your website contact form.</p>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #f8f9fb; border-radius: 10px; padding: 28px; border: 1px solid #e8ecf1;">
          <p style="font-size: 14px; color: #333333; margin: 0 0 16px; line-height: 1.6;">
            <strong style="color: #1a1a2e;">Subject:</strong> ${subject}
          </p>
          <p style="font-size: 14px; color: #333333; margin: 0 0 16px; line-height: 1.6; white-space: pre-wrap;">
            <strong style="color: #1a1a2e;">Message:</strong><br/>${message}
          </p>

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 20px; border-top: 1px solid #e8ecf1; padding-top: 16px;">
            <tr>
              <td style="font-size: 12px; color: #888888; padding: 4px 0;">From:</td>
              <td style="font-size: 12px; color: #555555; padding: 4px 0;">${fromName} <${fromEmail}></td>
            </tr>
            ${phoneSection}
            <tr>
              <td style="font-size: 12px; color: #888888; padding: 4px 0;">Submitted at:</td>
              <td style="font-size: 12px; color: #555555; padding: 4px 0;">${timestamp}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return buildBaseLayout({
    title: 'New Contact Form Submission',
    preheader: `New message from ${fromName} via contact form.`,
    content,
    footer: 'Moor Hall Administration',
  });
}