/**
 * Auto Reply Email Template
 *
 * Automatically sent to users who contact us, confirming receipt of their message.
 */

import { buildBaseLayout } from './base-layout';
import { AutoReplyEmailData } from '../types/email.types';

export function autoReplyTemplate(data: AutoReplyEmailData): string {
  const { toName, originalSubject, originalMessage, replyMessage, timestamp } = data;

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background-color: #e0e7ff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8L10.5 13L21 3M3 8L10.5 13L12 13.5M3 8L10.5 13L21 3M12 13.5L21 3M12 13.5V17.5C12 18.8807 10.8807 20 9.5 20H4.5C3.11929 20 2 18.8807 2 17.5V15.5C2 14.1193 3.11929 13 4.5 13H9.5L12 13.5Z" stroke="#4338ca" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px;">Thank You for Contacting Us</h1>
      <p style="font-size: 16px; color: #555555; margin: 0; max-width: 460px; margin: 0 auto;">Hi ${toName}, we have received your message and our team will get back to you shortly.</p>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #f8f9fb; border-radius: 10px; padding: 28px; border: 1px solid #e8ecf1;">
          <p style="font-size: 13px; color: #888888; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Your Original Message</p>
          <p style="font-size: 14px; color: #333333; margin: 0 0 8px;">
            <strong style="color: #1a1a2e;">Subject:</strong> ${originalSubject}
          </p>
          <p style="font-size: 14px; color: #333333; margin: 0; line-height: 1.6; white-space: pre-wrap;">${originalMessage}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #f0fdf4; border-radius: 10px; padding: 28px; border: 1px solid #bbf7d0;">
          <p style="font-size: 13px; color: #166534; margin: 0 0 8px; font-weight: 600;">Our Response</p>
          <p style="font-size: 14px; color: #166534; margin: 0; line-height: 1.6; white-space: pre-wrap;">${replyMessage}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding: 16px 0; border-top: 1px solid #e8ecf1;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="font-size: 12px; color: #888888;">Responded at:</td>
              <td style="font-size: 12px; color: #555555; text-align: right;">${timestamp}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return buildBaseLayout({
    title: 'Thank You for Contacting Us',
    preheader: 'We have received your message and will respond shortly.',
    content,
    footer: 'Moor Hall Customer Support',
  });
}