import { z } from 'zod';

export const contactEmailSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .trim(),
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email address too long'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s\-\(\)]{7,20}$/.test(val),
      'Invalid phone number format'
    ),
  subject: z
    .string()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must not exceed 200 characters')
    .trim(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must not exceed 5000 characters'),
});

export type ContactEmailInput = z.infer<typeof contactEmailSchema>;

export const welcomeEmailSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email address too long'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .trim(),
});

export type WelcomeEmailInput = z.infer<typeof welcomeEmailSchema>;

export const sendForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email address too long')
    .toLowerCase()
    .trim(),
});

export type SendForgotPasswordInput = z.infer<typeof sendForgotPasswordSchema>;

export const emailRateLimitSchema = z.object({
  windowMs: z.number().default(60000),
  max: z.number().default(10),
});

export const emailHealthSchema = z.object({
  primary: z.boolean(),
  fallback: z.boolean().optional(),
  providers: z.array(z.object({
    provider: z.string(),
    healthy: z.boolean(),
    lastCheck: z.string().transform((s) => new Date(s)),
    error: z.string().optional(),
  })),
});

export function sanitizeEmailAddress(email: string): string {
  return email.trim().toLowerCase().substring(0, 254);
}

export function validateEmailStrict(email: string): { valid: boolean; error?: string } {
  const sanitized = email.trim().toLowerCase();

  if (!sanitized) return { valid: false, error: 'Email address is required' };
  if (sanitized.length > 254) return { valid: false, error: 'Email address is too long' };

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid email address format' };
  }

  const disposableDomains = [
    'tempmail.com', 'throwaway.com', 'guerrillamail.com',
    'mailinator.com', '10minutemail.com', 'yopmail.com',
  ];
  const domain = sanitized.split('@')[1];
  if (disposableDomains.includes(domain)) {
    return { valid: false, error: 'Disposable email addresses are not allowed' };
  }

  return { valid: true };
}

export function sanitizeInput(str: string, maxLength = 5000): string {
  if (!str || typeof str !== 'string') return '';

  return str
    .substring(0, maxLength)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, ' ')
    .replace(/<\s*iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<\s*object[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<\s*embed[^>]*>[\s\S]*?<\/embed>/gi, '')
    .trim();
}