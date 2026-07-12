/**
 * Nodemailer Type Declarations
 *
 * Provides TypeScript type definitions for nodemailer since
 * @types/nodemailer may not be installed.
 *
 * Compatible with moduleResolution: "NodeNext" (used in tsconfig.json).
 *
 * Usage:
 *   import nodemailer, { Transporter, MailOptions } from 'nodemailer';
 *   const t: Transporter = nodemailer.createTransport({ ... });
 */

declare namespace nodemailer {
  interface Attachment {
    filename?: string;
    content?: string | Buffer;
    path?: string;
    href?: string;
    contentType?: string;
    contentDisposition?: string;
    encoding?: string;
    headers?: Record<string, string>;
  }

  interface MailOptions {
    from?: string | { name?: string; address: string };
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    replyTo?: string | string[];
    attachments?: Attachment[];
    headers?: Record<string, string>;
    messageId?: string;
  }

  interface SentMessageInfo {
    accepted: string[];
    rejected: string[];
    pending: string[];
    response: string;
    envelope: {
      from: string;
      to: string[];
    };
    messageId: string;
  }

  interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user?: string;
      pass?: string;
      accessToken?: string;
      type?: string;
    };
    tls?: {
      rejectUnauthorized?: boolean;
    };
    connectionTimeout?: number;
    greetingTimeout?: number;
    socketTimeout?: number;
    pool?: boolean;
    maxConnections?: number;
    maxMessages?: number;
  }

  interface Transporter {
    sendMail(mailOptions: MailOptions): Promise<SentMessageInfo>;
    verify(): Promise<boolean>;
    close(): void;
  }

  function createTransport(options: string | TransportOptions): Transporter;
}

declare module 'nodemailer' {
  export = nodemailer;
}