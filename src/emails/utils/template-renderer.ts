export function renderTemplate(template: string, variables: Record<string, string | number | boolean>): string {
  let rendered = template;

  const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    const value = String(variables[key]);
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g');
    rendered = rendered.replace(regex, value);
  }

  return rendered;
}

export function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  const hostname = process.env.SMTP_HOST || 'moorhall.com';
  return `<${timestamp}.${random}@${hostname}>`;
}

export function sanitizeSubject(subject: string): string {
  return subject
    .replace(/[\r\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}