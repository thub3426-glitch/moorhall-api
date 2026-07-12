import { buildBaseLayout } from './base-layout';
import { ForgotPasswordEmailData } from '../types/email.types';

export function forgotPasswordTemplate(data: ForgotPasswordEmailData): string {
  const { toName, resetLink, expiryTime, requestIp, requestTime } = data;

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background-color: #fef3c7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 15V18M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11M15 21H9C7.89543 21 7 20.1046 7 19V11C7 7.13401 10.134 4 14 4C15.624 4 17.1143 4.62447 18.2488 5.63109" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px;">Password Reset Requested</h1>
      <p style="font-size: 16px; color: #555555; margin: 0; max-width: 460px; margin: 0 auto;">Hi ${toName}, we received a request to reset the password for your Moor Hall account.</p>
    </div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #f8f9fb; border-radius: 10px; padding: 28px; border: 1px solid #e8ecf1;">
          <p style="font-size: 14px; color: #555555; margin: 0 0 20px; line-height: 1.6;">
            Click the button below to create a new password. This link will expire in <strong>${expiryTime}</strong>.
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
            <tr>
              <td style="border-radius: 8px; background-color: #1a1a2e;">
                <a href="${resetLink}" target="_blank" style="
                  display: inline-block;
                  padding: 14px 36px;
                  color: #ffffff !important;
                  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                  font-size: 15px;
                  font-weight: 700;
                  text-decoration: none;
                  border-radius: 8px;
                ">
                  Reset My Password
                </a>
              </td>
            </tr>
          </table>
          <p style="font-size: 12px; color: #888888; margin: 16px 0 0; line-height: 1.5;">
            If you didn't request this reset, you can safely ignore this email. Your password will not be changed.
          </p>
        </td>
      </tr>
    </table>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 8px;">
      <tr>
        <td style="padding: 16px 0; border-top: 1px solid #e8ecf1;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="font-size: 12px; color: #888888;">Request IP:</td>
              <td style="font-size: 12px; color: #555555; text-align: right;">${requestIp || 'Unknown'}</td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #888888;">Request time:</td>
              <td style="font-size: 12px; color: #555555; text-align: right;">${requestTime}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return buildBaseLayout({
    title: 'Password Reset',
    preheader: 'A password reset has been requested for your account.',
    content,
    ctaButton: {
      text: 'Reset My Password',
      url: resetLink,
      color: '#ffffff',
      backgroundColor: '#1a1a2e',
    },
    footer: 'Moor Hall Security',
  });
}