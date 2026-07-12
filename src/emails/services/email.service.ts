import nodemailer from 'nodemailer';
import transporterManager from '../config/transporter.config';
import {
  EmailOptions,
  EmailSendResult,
  EmailProvider,
  ForgotPasswordEmailData,
  ResetSuccessEmailData,
  ContactEmailData,
  AutoReplyEmailData,
  WelcomeEmailData,
} from '../types/email.types';
import { generateMessageId, sanitizeSubject, isValidEmail } from '../utils/template-renderer';
import ApiError from '../../utils/apiError';
import { getAvailableTemplates, getTemplate } from '../templates/index';
import { forgotPasswordTemplate } from '../templates/forgot-password.template';
import { resetSuccessTemplate } from '../templates/reset-success.template';
import { contactEmailTemplate } from '../templates/contact.template';
import { autoReplyTemplate } from '../templates/auto-reply.template';
import { welcomeTemplate } from '../templates/welcome.template';

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

class EmailService {
  private fromName: string;
  private fromEmail: string;
  private replyToEmail: string;

  constructor() {
    this.fromName = process.env.EMAIL_FROM_NAME || 'Moor Hall';
    this.fromEmail = process.env.EMAIL_FROM_ADDRESS || 'noreply@moorhall.com';
    this.replyToEmail = process.env.EMAIL_REPLY_TO || 'support@moorhall.com';
  }

  private get transporter(): nodemailer.Transporter {
    return transporterManager.getTransporter();
  }

  private get fallbackTransporter(): nodemailer.Transporter | null {
    return transporterManager.getFallbackTransporter();
  }

  async send(options: EmailOptions): Promise<EmailSendResult> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    for (const recipient of recipients) {
      if (!isValidEmail(recipient)) {
        throw new ApiError(400, `Invalid email address: ${recipient}`);
      }
    }

    this.checkRateLimit(recipients[0]);

    const mailOptions: nodemailer.MailOptions = {
      from: {
        name: this.fromName,
        address: this.fromEmail,
      },
      to: options.to,
      ...(options.cc && { cc: options.cc }),
      ...(options.bcc && { bcc: options.bcc }),
      ...(options.replyTo && { replyTo: options.replyTo }),
      subject: sanitizeSubject(options.subject),
      html: options.html,
      ...(options.text && { text: options.text }),
      ...(options.attachments && { attachments: options.attachments }),
      messageId: generateMessageId(),
    };

    if (options.priority) {
      mailOptions.headers = {
        ...options.headers,
        'X-Priority': options.priority === 'high' ? '1' : options.priority === 'low' ? '5' : '3',
        'X-MSMail-Priority': options.priority === 'high' ? 'High' : options.priority === 'low' ? 'Low' : 'Normal',
      };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.trackResult('primary', 'success', info);
      return this.formatResult(info);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const smtpResponse = (error as any)?.response || (error as any)?.smtpResponse || undefined;
      console.error(`[Email] Primary transporter failed: ${errorMsg}`, smtpResponse ? `SMTP response: ${smtpResponse}` : '');
      this.trackResult('primary', 'failed', { message: errorMsg, smtpResponse });

      if (this.fallbackTransporter) {
        try {
          console.log('[Email] Attempting fallback transporter...');
          const info = await this.fallbackTransporter.sendMail(mailOptions);
          this.trackResult('fallback', 'success', info);
          return this.formatResult(info);
        } catch (fallbackError) {
          const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
          const fallbackSmtpResponse = (fallbackError as any)?.response || (fallbackError as any)?.smtpResponse || undefined;
          console.error(`[Email] Fallback transporter failed: ${fallbackMsg}`, fallbackSmtpResponse ? `SMTP response: ${fallbackSmtpResponse}` : '');
          this.trackResult('fallback', 'failed', { message: fallbackMsg, smtpResponse: fallbackSmtpResponse });
        }
      }

      throw new ApiError(500, `Failed to send email: ${errorMsg}`);
    }
  }

  async sendTemplate(
    templateName: string,
    variables: Record<string, string | number | boolean>,
    options: Omit<EmailOptions, 'html' | 'text' | 'subject'>
  ): Promise<EmailSendResult> {
    const template = getTemplate(templateName, variables);
    if (!template) {
      throw new ApiError(400, `Template not found: ${templateName}. Available: ${getAvailableTemplates().join(', ')}`);
    }

    return this.send({
      ...options,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendForgotPasswordEmail(data: ForgotPasswordEmailData): Promise<EmailSendResult> {
    const html = forgotPasswordTemplate(data);
    const text = `Password Reset Requested\n\nHi ${data.toName},\n\nWe received a request to reset the password for your Moor Hall account.\n\nClick the link below to reset your password (expires in ${data.expiryTime}):\n${data.resetLink}\n\nIf you didn't request this reset, you can safely ignore this email.\n\nRequest IP: ${data.requestIp || 'Unknown'}\nRequest time: ${data.requestTime}`;

    return this.send({
      to: data.to,
      subject: 'Password Reset Requested',
      html,
      text,
      priority: 'high',
      metadata: { type: 'forgot-password', recipient: data.to },
    });
  }

  async sendResetSuccessEmail(data: ResetSuccessEmailData): Promise<EmailSendResult> {
    const html = resetSuccessTemplate(data);
    const text = `Password Reset Successful\n\nHi ${data.toName},\n\nYour password has been successfully reset. You can now log in with your new password.\n\nIf you did not make this change, please contact our support team immediately.\n\nReset completed: ${data.timestamp}\n\nLog in: ${data.loginLink}`;

    return this.send({
      to: data.to,
      subject: 'Password Reset Successful',
      html,
      text,
      priority: 'high',
      metadata: { type: 'reset-success', recipient: data.to },
    });
  }

  async sendContactEmail(data: ContactEmailData): Promise<EmailSendResult> {
    const html = contactEmailTemplate(data);
    const text = `New Contact Form Submission\n\nSubject: ${data.subject}\nFrom: ${data.fromName} <${data.fromEmail}>\n${data.fromPhone ? `Phone: ${data.fromPhone}\n` : ''}Time: ${data.timestamp}\n\nMessage:\n${data.message}`;

    return this.send({
      to: data.adminEmails,
      subject: `[Contact Form] ${data.subject}`,
      html,
      text,
      replyTo: data.fromEmail,
      priority: 'normal',
      metadata: { type: 'contact', fromEmail: data.fromEmail },
    });
  }

  async sendAutoReplyEmail(data: AutoReplyEmailData): Promise<EmailSendResult> {
    const html = autoReplyTemplate(data);
    const text = `Thank You for Contacting Us\n\nHi ${data.toName},\n\nWe have received your message regarding "${data.originalSubject}" and our team will get back to you shortly.\n\nYour message:\n${data.originalMessage}\n\nOur response:\n${data.replyMessage}\n\nResponded at: ${data.timestamp}`;

    return this.send({
      to: data.to,
      subject: `Re: ${data.originalSubject}`,
      html,
      text,
      replyTo: this.replyToEmail,
      priority: 'normal',
      metadata: { type: 'auto-reply', recipient: data.to },
    });
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailSendResult> {
    const html = welcomeTemplate(data);
    const text = `Welcome to Moor Hall!\n\nHi ${data.toName},\n\nYour account has been successfully created. Welcome aboard!\n\nLog in to your account: ${data.loginLink}\n\nAccount created: ${data.timestamp}\n\nNeed help? Contact us at support@moorhall.com`;

    return this.send({
      to: data.to,
      subject: 'Welcome to Moor Hall',
      html,
      text,
      priority: 'normal',
      metadata: { type: 'welcome', recipient: data.to },
    });
  }

  private checkRateLimit(recipient: string): void {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxPerWindow = 10;

    const record = rateLimitStore.get(recipient);

    if (record && now < record.resetTime) {
      if (record.count >= maxPerWindow) {
        throw new ApiError(429, `Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`);
      }
      record.count++;
    } else {
      rateLimitStore.set(recipient, { count: 1, resetTime: now + windowMs });
    }
  }

  private formatResult(info: nodemailer.SentMessageInfo): EmailSendResult {
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
      pending: info.pending || [],
      response: info.response || '',
      envelope: {
        from: info.envelope?.from || '',
        to: info.envelope?.to || [],
      },
    };
  }

  private trackResult(provider: string, status: string, detail: unknown): void {
    let serialized = '';
    try {
      serialized = typeof detail === 'object' ? JSON.stringify(detail) : String(detail);
    } catch (err) {
      serialized = String(detail);
    }
    console.log(`[Email] ${provider} ${status}:`, serialized);
  }

  async healthCheck(): Promise<{ primary: boolean; fallback?: boolean }> {
    const activeProvider = transporterManager.getActiveProvider();

    const result: { primary: boolean; fallback?: boolean } = {
      primary: await transporterManager.verifyTransporter(this.transporter, activeProvider),
    };

    if (this.fallbackTransporter) {
      const fallbackProvider =
        typeof transporterManager.getFallbackProvider === 'function'
          ? transporterManager.getFallbackProvider()
          : null;

      // If we don't know the exact fallback provider name, fall back to 'mailtrap' for verification
      result.fallback = await transporterManager.verifyTransporter(
        this.fallbackTransporter,
        (fallbackProvider || ('mailtrap' as EmailProvider))
      );
    }

    return result;
  }
}

const emailService = new EmailService();

export default emailService;
export { EmailService };