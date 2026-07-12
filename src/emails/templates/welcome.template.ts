/**
 * Welcome Email Template
 *
 * Sent when a new admin account is successfully registered.
 */

import { buildBaseLayout } from './base-layout';
import { WelcomeEmailData } from '../types/email.types';

export function welcomeTemplate(data: WelcomeEmailData): string {
  const { toName, loginLink, timestamp } = data;

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background-color: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px;">Welcome to Moor Hall!</h1>
      <p style="font-size: 16px; color: #555555; margin: 0; max-width: 460px; margin: 0 auto;">Hi ${toName}, your account has been successfully created. Welcome aboard!</p>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #f8f9fb; border-radius: 10px; padding: 28px; border: 1px solid #e8ecf1;">
          <p style="font-size: 14px; color: #555555; margin: 0 0 20px; line-height: 1.6;">
            Your account is now active and ready to use. Click the button below to log in and get started.
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
            <tr>
              <td style="border-radius: 8px; background-color: #1a1a2e;">
                <a href="${loginLink}" target="_blank" style="
                  display: inline-block;
                  padding: 14px 36px;
                  color: #ffffff !important;
                  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                  font-size: 15px;
                  font-weight: 700;
                  text-decoration: none;
                  border-radius: 8px;
                ">
                  Log In to Your Account
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
      <tr>
        <td style="background-color: #fffbeb; border-radius: 10px; padding: 20px 24px; border: 1px solid #fde68a;">
          <p style="font-size: 14px; color: #92400e; margin: 0; line-height: 1.6;">
            <strong>Need help?</strong> If you have any questions, simply reply to this email or contact our support team at <a href="mailto:support@moorhall.com" style="color: #92400e;">support@moorhall.com</a>.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding: 16px 0; border-top: 1px solid #e8ecf1;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="font-size: 12px; color: #888888;">Account created:</td>
              <td style="font-size: 12px; color: #555555; text-align: right;">${timestamp}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return buildBaseLayout({
    title: 'Welcome to Moor Hall',
    preheader: 'Your account has been successfully created.',
    content,
    ctaButton: {
      text: 'Log In to Your Account',
      url: loginLink,
      color: '#ffffff',
      backgroundColor: '#1a1a2e',
    },
    footer: 'Moor Hall Team',
  });
}