import { buildBaseLayout } from './base-layout';
import { ResetSuccessEmailData } from '../types/email.types';

export function resetSuccessTemplate(data: ResetSuccessEmailData): string {
  const { toName, loginLink, timestamp } = data;

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background-color: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13l4 4L19 7" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px;">Password Reset Successful</h1>
      <p style="font-size: 16px; color: #555555; margin: 0; max-width: 460px; margin: 0 auto;">Hi ${toName}, your password has been successfully reset. You can now log in with your new password.</p>
    </div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #f8f9fb; border-radius: 10px; padding: 28px; border: 1px solid #e8ecf1;">
          <p style="font-size: 14px; color: #555555; margin: 0 0 20px; line-height: 1.6;">
            If you did not make this change, please contact our support team immediately by replying to this email.
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
                  Log In Now
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td style="padding: 16px 0; border-top: 1px solid #e8ecf1;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="font-size: 12px; color: #888888;">Reset completed:</td>
              <td style="font-size: 12px; color: #555555; text-align: right;">${timestamp}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return buildBaseLayout({
    title: 'Password Reset Successful',
    preheader: 'Your password has been successfully reset.',
    content,
    ctaButton: {
      text: 'Log In Now',
      url: loginLink,
      color: '#ffffff',
      backgroundColor: '#1a1a2e',
    },
    footer: 'Moor Hall Security',
  });
}