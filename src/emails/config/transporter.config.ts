import nodemailer from 'nodemailer';
import ApiError from '../../utils/apiError';
import { EmailProviderConfig, EmailProvider, EmailProviderHealth } from '../types/email.types';

const providerHealth: Map<EmailProvider, EmailProviderHealth> = new Map();

function updateProviderHealth(provider: EmailProvider, healthy: boolean, error?: string): void {
  providerHealth.set(provider, {
    provider,
    healthy,
    lastCheck: new Date(),
    error,
  });
}

function validateSMTPConfig(config: EmailProviderConfig, providerName: string): void {
  const missing: string[] = [];
  if (!config.host) missing.push('SMTP_HOST');
  if (!config.port) missing.push('SMTP_PORT');
  if (!config.auth || !config.auth.user) missing.push('SMTP_USER');
  if (!config.auth || !config.auth.pass) missing.push('SMTP_PASS');

  if (missing.length > 0) {
    const msg = `${providerName}: Missing ${missing.join(', ')}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    } else {
      // In non-production, warn but allow running (useful for local/dev)
      // This prevents hidden failures where empty credentials are silently used.
      // A missing credential will likely make SMTP operations fail at send time.
      // The server startup will still attempt verification if configured to do so.
      // eslint-disable-next-line no-console
      console.warn(`[Email] ${msg} — continuing in non-production mode`);
    }
  }
}



function getMailtrapConfig(): EmailProviderConfig {
  const host = process.env.MAILTRAP_SMTP_HOST || 'sandbox.smtp.mailtrap.io';
  const port = parseInt(process.env.MAILTRAP_SMTP_PORT || '2525', 10);
  const user = process.env.MAILTRAP_SMTP_USER || '';
  const pass = process.env.MAILTRAP_SMTP_PASS || '';

  const config: EmailProviderConfig = {
    provider: 'mailtrap',
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };

  validateSMTPConfig(config, 'Mailtrap');

  return config;
}

function getCustomConfig(): EmailProviderConfig {
  // Trim environment inputs to avoid accidental whitespace issues
  const rawHost = (process.env.SMTP_HOST || '').trim();
  const rawUser = (process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || '').trim();
  const explicitPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : NaN;

  // Map common shorthand host names to real SMTP hosts
  const aliasMap: Record<string, { host: string; port: number; secure: boolean }> = {
    gmail: { host: 'smtp.gmail.com', port: 465, secure: true },
    outlook: { host: 'smtp.office365.com', port: 587, secure: false },
    yahoo: { host: 'smtp.mail.yahoo.com', port: 465, secure: true },
  };

  let host = rawHost;
  let port = !isNaN(explicitPort) ? explicitPort : 587;
  let secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (rawHost) {
    const key = rawHost.toLowerCase();
    if (aliasMap[key]) {
      const mapped = aliasMap[key];
      host = mapped.host;
      // Only override port if the user did not explicitly set one
      if (isNaN(explicitPort)) port = mapped.port;
      secure = mapped.secure;
      console.log(`[Email] Normalized SMTP host alias '${rawHost}' -> '${host}:${port}'`);
    }
  }

  // Warn if password contains whitespace which often indicates a malformed value
  if (rawPass.includes(' ')) {
    console.warn('[Email] SMTP_PASS contains whitespace — ensure the password is a valid app password or wrap it in quotes in your .env');
  }

  const config: EmailProviderConfig = {
    provider: 'custom',
    host,
    port,
    secure,
    auth: { user: rawUser, pass: rawPass },
  };

  validateSMTPConfig(config, 'Custom SMTP');

  return config;
}

function createTransporter(config: EmailProviderConfig): nodemailer.Transporter {
  const transportOptions: any = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  };

  // Only attach auth when credentials are present to avoid sending empty auth
  if (config.auth && config.auth.user && config.auth.pass) {
    transportOptions.auth = {
      user: config.auth.user,
      pass: config.auth.pass,
    };
  }

  return nodemailer.createTransport(transportOptions);
}

class TransporterManager {
  private primaryTransporter: nodemailer.Transporter | null = null;
  private fallbackTransporter: nodemailer.Transporter | null = null;
  private primaryConfig: EmailProviderConfig | null = null;
  private fallbackConfig: EmailProviderConfig | null = null;
  private activeProvider: EmailProvider;
  private initialized = false;

  constructor() {
    const envProvider = process.env.EMAIL_PROVIDER;
    if (envProvider && (envProvider === 'mailtrap' || envProvider === 'custom')) {
      this.activeProvider = envProvider as EmailProvider;
    } else if (process.env.SMTP_HOST) {
      this.activeProvider = 'custom';
      console.log(`[Email] No EMAIL_PROVIDER set; using custom SMTP from SMTP_HOST=${process.env.SMTP_HOST}`);
    } else if (process.env.MAILTRAP_SMTP_HOST || process.env.MAILTRAP_SMTP_USER || process.env.MAILTRAP_SMTP_PASS) {
      this.activeProvider = 'mailtrap';
      console.log('[Email] No EMAIL_PROVIDER set; using Mailtrap because MAILTRAP_* env vars detected');
    } else {
      this.activeProvider = 'custom';
      console.log('[Email] EMAIL_PROVIDER not set; defaulting to custom');
    }
  }

  private initialize(): void {
    if (this.initialized) return;

    const primaryProvider = this.activeProvider;
    const fallbackProvider = (process.env.EMAIL_FALLBACK_PROVIDER || '') as EmailProvider;

    this.primaryConfig = this.getProviderConfig(primaryProvider);
    this.primaryTransporter = createTransporter(this.primaryConfig);

    console.log(
      `[Email] Primary provider: ${primaryProvider} (${this.primaryConfig.host}:${this.primaryConfig.port})`
    );

    if (fallbackProvider && fallbackProvider !== primaryProvider) {
      this.fallbackConfig = this.getProviderConfig(fallbackProvider);
      this.fallbackTransporter = createTransporter(this.fallbackConfig);
      console.log(
        `[Email] Fallback provider: ${fallbackProvider} (${this.fallbackConfig.host}:${this.fallbackConfig.port})`
      );
    }

    this.initialized = true;
  }

  private getProviderConfig(provider: EmailProvider): EmailProviderConfig {
    switch (provider) {
      case 'mailtrap':
        return getMailtrapConfig();
      case 'custom':
        return getCustomConfig();
      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }
  }

  getTransporter(): nodemailer.Transporter {
    this.initialize();
    if (!this.primaryTransporter) {
      throw new ApiError(500, 'Email transporter failed to initialize');
    }
    return this.primaryTransporter;
  }

  getFallbackTransporter(): nodemailer.Transporter | null {
    this.initialize();
    return this.fallbackTransporter;
  }

  getActiveProvider(): EmailProvider {
    return this.activeProvider;
  }

  getFallbackProvider(): EmailProvider | null {
    this.initialize();
    return this.fallbackConfig ? this.fallbackConfig.provider : null;
  }

  getHealthStatus(): EmailProviderHealth[] {
    return Array.from(providerHealth.values());
  }

  async verifyTransporter(transporter: nodemailer.Transporter, provider: EmailProvider): Promise<boolean> {
    try {
      // If we have the config for this provider, ensure credentials exist before attempting verify
      let cfg: EmailProviderConfig | null = null;
      if (this.primaryConfig && this.primaryConfig.provider === provider) cfg = this.primaryConfig;
      else if (this.fallbackConfig && this.fallbackConfig.provider === provider) cfg = this.fallbackConfig;

      if (cfg) {
        if (!cfg.auth || !cfg.auth.user || !cfg.auth.pass) {
          const msg = 'Missing SMTP credentials';
          updateProviderHealth(provider, false, msg);
          console.error(`[Email] ${provider} verification failed: ${msg}`);
          return false;
        }
      }

      await transporter.verify();
      updateProviderHealth(provider, true);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateProviderHealth(provider, false, errorMessage);
      console.error(`[Email] ${provider} verification failed:`, errorMessage);
      return false;
    }
  }

  async verifyAll(): Promise<void> {
    this.initialize();
    let primaryHealthy = true;
    let fallbackHealthy = false;

    if (this.primaryTransporter) {
      primaryHealthy = await this.verifyTransporter(this.primaryTransporter, this.activeProvider);
    }

    if (this.fallbackTransporter && this.fallbackConfig) {
      fallbackHealthy = await this.verifyTransporter(this.fallbackTransporter, this.fallbackConfig.provider);
    }

    // If primary is unhealthy but fallback is healthy, promote fallback to primary
    if (!primaryHealthy && fallbackHealthy && this.fallbackTransporter && this.fallbackConfig) {
      console.warn(
        `[Email] Primary provider (${this.activeProvider}) failed verification. Switching to fallback (${this.fallbackConfig.provider}).`
      );
      this.primaryTransporter = this.fallbackTransporter;
      this.primaryConfig = this.fallbackConfig;
      this.activeProvider = this.fallbackConfig.provider;
      this.fallbackTransporter = null;
      this.fallbackConfig = null;
    }
  }
}

const transporterManager = new TransporterManager();

export default transporterManager;
export { transporterManager };