export interface EmailAddress {
  name: string;
  email: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending: string[];
  response: string;
  envelope: {
    from: string;
    to: string[];
  };
}

export interface EmailError {
  code: string;
  message: string;
  command?: string;
}

export type EmailProvider = 'mailtrap' | 'resend' | 'postmark' | 'custom';

export interface EmailProviderConfig {
  provider: EmailProvider;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailProviderHealth {
  provider: EmailProvider;
  healthy: boolean;
  lastCheck: Date;
  error?: string;
}

export interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text: string;
}

export interface ForgotPasswordEmailData {
  to: string;
  toName: string;
  resetLink: string;
  expiryTime: string;
  requestIp?: string;
  requestTime: string;
}

export interface ResetSuccessEmailData {
  to: string;
  toName: string;
  loginLink: string;
  timestamp: string;
}

export interface ContactEmailData {
  fromName: string;
  fromEmail: string;
  fromPhone?: string;
  subject: string;
  message: string;
  timestamp: string;
  adminEmails: string[];
}

export interface AutoReplyEmailData {
  to: string;
  toName: string;
  originalSubject: string;
  originalMessage: string;
  replyMessage: string;
  timestamp: string;
}

export interface WelcomeEmailData {
  to: string;
  toName: string;
  loginLink: string;
  timestamp: string;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  priority?: 'high' | 'normal' | 'low';
  headers?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface EmailQueueItem {
  id: string;
  template: string;
  options: EmailOptions;
  priority: number;
  maxRetries: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'deferred';
  createdAt: Date;
  scheduledAt?: Date;
  lastAttemptAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface EmailServiceConfig {
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
  provider: EmailProvider;
  providers: {
    primary: EmailProviderConfig;
    fallback?: EmailProviderConfig;
  };
  rateLimit: {
    maxPerMinute: number;
    maxPerHour: number;
  };
  retry: {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier: number;
  };
  templates: {
    baseUrl: string;
    defaultLocale: string;
  };
  tracking: {
    enabled: boolean;
    openTracking: boolean;
    clickTracking: boolean;
  };
}