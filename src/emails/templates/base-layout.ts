export function buildBaseLayout(params: {
  title: string;
  preheader: string;
  content: string;
  ctaButton?: {
    text: string;
    url: string;
    color?: string;
    backgroundColor?: string;
  };
  footer?: string;
  brandName?: string;
  unsubscribeLink?: string;
}): string {
  const {
    title,
    preheader,
    content,
    ctaButton,
    footer = 'Moor Hall',
    brandName = 'Moor Hall',
    unsubscribeLink = '#',
  } = params;

  const ctaSection = ctaButton
    ? `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 30px auto 0; border-collapse: collapse;">
      <tr>
        <td style="border-radius: 8px; background-color: ${ctaButton.backgroundColor || '#1a1a2e'};">
          <a href="${ctaButton.url}" target="_blank" style="
            display: inline-block;
            padding: 16px 40px;
            color: ${ctaButton.color || '#ffffff'} !important;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 16px;
            font-weight: 700;
            text-decoration: none;
            letter-spacing: 0.5px;
            border-radius: 8px;
          ">
            ${ctaButton.text}
          </a>
        </td>
      </tr>
    </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #1a1a2e !important; }
      .email-body { background-color: #16213e !important; }
      .email-text { color: #e0e0e0 !important; }
      .email-subtext { color: #b0b0b0 !important; }
      .footer-text { color: #888888 !important; }
    }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-center { text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f4f4f7; -webkit-font-smoothing: antialiased;">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${preheader}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f7; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color: #1a1a2e; padding: 36px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <div style="font-family: 'Georgia', serif; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: 2px;">
                      ${brandName}
                    </div>
                    <div style="font-size: 13px; color: #8b8fa3; margin-top: 6px; letter-spacing: 1.5px; text-transform: uppercase;">
                      ${title}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top: 2px solid #e8ecf1; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-body" style="background-color: #ffffff; padding: 40px; color: #2d2d3a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.7;">
              ${content}
            </td>
          </tr>
          ${ctaSection}
          <tr>
            <td style="background-color: #f8f9fb; padding: 30px 40px; text-align: center; border-top: 1px solid #e8ecf1;">
              <p class="footer-text" style="margin: 0 0 8px; font-size: 13px; color: #888888; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                ${footer} &mdash; ${new Date().getFullYear()}
              </p>
              <p class="footer-text" style="margin: 0 0 12px; font-size: 12px; color: #aaaaaa; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                This email was sent to <span style="color: #666666;">{{recipient}}</span> because you are a valued member of our community.
              </p>
              <p style="margin: 0; font-size: 12px;">
                <a href="${unsubscribeLink}" style="color: #888888; text-decoration: underline;">Unsubscribe</a>
                &nbsp;&middot;&nbsp;
                <a href="${process.env.FRONTEND_URL || 'https://moorhall.com'}" style="color: #888888; text-decoration: underline;">View in Browser</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:support@moorhall.com" style="color: #888888; text-decoration: underline;">Contact Support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}