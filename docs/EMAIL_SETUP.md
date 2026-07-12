# Email System Setup & Deployment Guide

## Overview

This document covers the complete email system architecture for the Moor Hall API, including SMTP provider configuration, deployment instructions, and best practices for reliable email delivery.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Why Not Gmail SMTP](#why-not-gmail-smtp)
3. [SMTP Provider Options](#smtp-provider-options)
4. [Environment Configuration](#environment-configuration)
5. [Transactional Provider Setup](#transactional-provider-setup)
6. [Mailtrap Setup (Development)](#mailtrap-setup-development)
7. [Netlify Deployment](#netlify-deployment)
8. [DNS Configuration](#dns-configuration)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
moor-hall-api/src/emails/
├── config/
│   └── transporter.config.ts    # SMTP provider config + fallback
├── controllers/
│   └── email.controller.ts      # HTTP handlers for email endpoints
├── services/
│   └── email.service.ts         # Core email service (all send methods)
├── templates/
│   ├── base-layout.ts           # Reusable HTML email layout
│   ├── forgot-password.ts       # Password reset request template
│   ├── reset-success.ts         # Password reset confirmation template
│   ├── contact.ts               # Contact form notification template
│   ├── auto-reply.ts            # Auto-reply template
│   ├── welcome.ts               # Welcome email template
│   └── index.ts                 # Template registry
├── types/
│   └── email.types.ts           # TypeScript interfaces
├── utils/
│   ├── template-renderer.ts     # Template rendering + helpers
│   └── email-validators.ts      # Zod validation schemas
├── index.ts                     # Public API entry point
└── routes/                      # (at src/routes/email.routes.ts)
```

### Email Methods

| Method | Purpose | Trigger |
|--------|---------|---------|
| `sendForgotPasswordEmail()` | Sends password reset link | User requests reset |
| `sendResetSuccessEmail()` | Confirms successful reset | After password change |
| `sendContactEmail()` | Notifies admin of contact form | User submits form |
| `sendAutoReplyEmail()` | Auto-replies to user | After contact form |
| `sendWelcomeEmail()` | Welcomes new user | After registration |

---

## Why Not Gmail SMTP

### The Problem with Gmail on Netlify

1. **"Less Secure App Access" Deprecated**
   - Google disabled this feature on May 30, 2022
   - Apps using just username/password no longer work
   - Error: `534-5.7.14 Please log in via your web browser`

2. **App Passwords Are Unreliable**
   - Require 2FA enabled on the Google account
   - Can be revoked by Google at any time
   - May stop working when Google detects "unusual activity"
   - Don't work with Google Workspace accounts managed by organizations

3. **Cloud IP Reputation Issues**
   - Netlify uses shared IP pools
   - These IPs may be blacklisted or flagged by Google
   - Google may block sign-in attempts from "unknown locations"
   - Results in `534-5.7.9 Application-specific password required`

4. **Rate Limits**
   - Gmail SMTP: ~500 emails/day
   - Google Workspace: ~2,000 emails/day
   - Not suitable for transactional email at scale

5. **No Delivery Analytics**
   - No built-in tracking of opens, clicks, bounces
   - No webhook support for delivery events

### Why Transactional Email Providers Are Better

| Feature | Gmail SMTP | Transactional Provider |
|---------|-----------|------------------|
| Free tier | 500/day | Varies by provider |
| Dedicated IP | No | Often available (with warm-up) |
| SPF/DKIM/DMARC | Manual setup | Provider-assisted or automated |
| Analytics | None | Full dashboard |
| Webhooks | No | Yes |
| Template engine | No | Built-in + API (varies) |
| Bounce handling | Manual | Automatic |
| Render compatible | ❌ Often fails | ✅ Works reliably |

---

## SMTP Provider Options

### Option 1: Transactional Provider (Recommended for Production)

A transactional email provider (for example, Sendinblue, Mailgun, Postmark, or similar) is recommended for production deployments because they provide better deliverability, analytics, and retries compared to generic Gmail SMTP.

**Setup (general steps):**
1. Create an account with your chosen provider.
2. Locate SMTP or Transactional settings in the provider dashboard.
3. Create or copy SMTP credentials (username + password) or API key.
4. Configure environment variables (see below) and verify sender/domain as required.

### Option 2: Mailtrap (Development/Testing)

**Mailtrap** is a fake SMTP server for development.

- **Free tier**: 500 emails/month
- **Emails are trapped** — not actually delivered
- **View emails** in a web dashboard
- **Perfect for** local development and testing

**Setup:**
1. Create account at [mailtrap.io](https://mailtrap.io)
2. Create an inbox
3. Copy SMTP credentials from the integration guide
4. Set `EMAIL_PROVIDER=mailtrap` in development

### Option 3: Resend / Postmark

Both are excellent alternatives:

- **Resend**: Free 3,000 emails/month, excellent DX, React email support
- **Postmark**: Focused on transactional email, 100 messages/day free

Both are compatible with the architecture — just update `transporter.config.ts`.

---

### Environment Configuration

### Required Variables

Create a `.env` file in `moor-hall-api/` (never commit this file):

```bash
# ─── Email Provider ────────────────────────────────────────────────
# Options: mailtrap | custom | postmark | resend
# For production, set `EMAIL_PROVIDER=custom` and configure SMTP_* below
# EMAIL_PROVIDER=custom

# ─── Custom SMTP credentials (example)
# SMTP_HOST=smtp.yourprovider.com
# SMTP_PORT=587
# SMTP_USER=your-username
# SMTP_PASS=your-password
# SMTP_SECURE=false

# ─── Email Identity ────────────────────────────────────────────────
EMAIL_FROM_NAME=Moor Hall
EMAIL_FROM_ADDRESS=noreply@moorhall.com
EMAIL_REPLY_TO=support@moorhall.com

# ─── Admin Notifications ───────────────────────────────────────────
# Comma-separated list of admin email addresses
ADMIN_EMAILS=admin@moorhall.com

# ─── Auto-reply Message ────────────────────────────────────────────
AUTO_REPLY_MESSAGE=Thank you for contacting Moor Hall. Our team will review your message and get back to you within 1-2 business days.

# ─── Frontend URL (for email links) ────────────────────────────────
FRONTEND_URL=https://your-frontend-domain.com
```

### Optional Variables

```bash
# Fallback provider (used if primary fails)
EMAIL_FALLBACK_PROVIDER=mailtrap
MAILTRAP_SMTP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_SMTP_PORT=2525
MAILTRAP_SMTP_USER=your-mailtrap-user
MAILTRAP_SMTP_PASS=your-mailtrap-pass

# Custom SMTP (alternative to Mailtrap)
SMTP_HOST=smtp.custom.com
SMTP_PORT=587
SMTP_USER=username
SMTP_PASS=password
SMTP_SECURE=false
```

---

## Transactional Provider Setup — Step by Step

### Step 1: Create Account
1. Sign up with your chosen transactional email provider (e.g., Sendinblue, Mailgun, Postmark).
2. Complete the required profile and organization settings in the provider dashboard.
3. Verify your sending domain if recommended by the provider for improved deliverability.

### Step 2: Get SMTP Credentials
1. Locate SMTP / Transactional settings in the provider dashboard.
2. Create or copy the SMTP credentials (username and password) or generate an API key if supported.
3. Store these credentials securely and add them to your `.env` file.

### Step 3: Verify Sender Domain (Recommended)
1. In the provider dashboard, add your sending domain (e.g., `moorhall.com`).
2. Follow the DNS verification steps (add TXT/SPF/DKIM/CNAME records) provided by the provider.
3. Wait for verification to complete (usually a few minutes to a few hours).

### Step 4: Configure Sender
1. Add and verify the sender email address or sender identity as required by your provider.
2. Ensure the `EMAIL_FROM_ADDRESS` used in your `.env` is a verified sender.

### Step 5: Test
1. Use the provider's test/send feature or trigger an email from the application.
2. Check the inbox (and spam folder) and confirm the email renders correctly.

---

## Mailtrap Setup (Development)

### Step 1: Create Account
1. Go to [mailtrap.io](https://mailtrap.io) and sign up
2. Create a new inbox

### Step 2: Get SMTP Credentials
1. Open your inbox
2. Go to **Settings** → **Inbox** → **Integrations**
3. Select "Node.js" (or "Other")
4. Copy the host, port, username, and password

### Step 3: Configure Environment
```bash
EMAIL_PROVIDER=mailtrap
MAILTRAP_SMTP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_SMTP_PORT=2525
MAILTRAP_SMTP_USER=your-username
MAILTRAP_SMTP_PASS=your-password
```

### Step 4: Test
1. Run your application in development mode
2. Trigger any email action
3. Check the Mailtrap dashboard to see the captured email

---

## Netlify Deployment

### Prerequisites
- Netlify account (https://app.netlify.com)
- GitHub/GitLab/Bitbucket repository
- Transactional email provider API key (SendGrid, Mailgun, etc.)
- PostgreSQL database (Supabase, Railway, AWS RDS, etc.)

### Step 1: Set Environment Variables
In the Netlify Dashboard, go to Settings → Build & Deploy → Environment → Edit Variables:

```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/database?sslmode=require
JWT_SECRET=your-secure-jwt-secret-key
SESSION_SECRET=your-session-secret-key
CORS_ORIGINS=https://your-frontend-domain.com

# Email Provider (use SendGrid or similar for production)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_NAME=Moor Hall
SENDGRID_FROM_EMAIL=noreply@moorhall.com
EMAIL_REPLY_TO=support@moorhall.com
ADMIN_EMAILS=admin@moorhall.com

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com
```

### Step 2: Deploy
1. Connect your GitHub repository to Netlify
2. Netlify automatically detects `netlify.toml` configuration
3. Click "Deploy site"
4. Verify build succeeds and environment variables are set
5. Test email functionality

**Check deployment**:
```bash
# Health check
curl https://your-site.netlify.app/health

# View function logs
# Netlify Dashboard → Functions → api → Logs
```

### Step 3: Verify Email Configuration
1. Test email endpoint with admin token
2. Check logs for any SMTP connection errors
3. Verify emails arrive in recipient inbox
4. Monitor SendGrid/provider dashboard for delivery status

### Netlify-Specific Considerations

1. **Function Execution Time**: Netlify has timeout limits (varies by plan). For large email operations:
   - Use async job queues if needed
   - Keep individual function execution under timeout
   - Monitor function logs for timeouts

2. **Cold Starts**: First invocation may be slow (typically <5 seconds):
   - Acceptable for background email operations
   - Use health checks to keep functions warm

3. **Environment Variables**: 
   - Set in Netlify Dashboard (not in .env files)
   - Redeploy after changing variables
   - Never commit secrets to Git

4. **Database Connection**:
   - Enable SSL (include `?sslmode=require` in CONNECTION_URL)
   - Use connection pooling for reliability
   - See [Netlify Deployment Guide](./NETLIFY_DEPLOYMENT.md) for details

### For Complete Deployment Guide
👉 **[See Netlify Deployment Guide](./NETLIFY_DEPLOYMENT.md)** for comprehensive setup instructions

---

## DNS Configuration

For production email deliverability, configure these DNS records:

### SPF (Sender Policy Framework)

**Purpose**: Authorizes which servers can send email on behalf of your domain.

**Record Type**: TXT
**Host**: `@` (or your domain)
**Value**:
```
v=spf1 include:_spf.yourprovider.com ~all
```

If you use multiple senders, merge provider includes as directed by your DNS/email provider.
```
v=spf1 include:_spf.yourprovider.com include:_spf.google.com ~all
```

### DKIM (DomainKeys Identified Mail)

**Purpose**: Cryptographically verifies that emails haven't been tampered with.

**How to get DKIM keys from your provider**:
1. In the provider dashboard, add your domain and follow the DKIM setup instructions.
2. The provider will provide TXT/CNAME records to add to your DNS.

**Record Type**: CNAME or TXT (provider-specific)
**Example** (provider will give the exact values):
```
s1._domainkey.moorhall.com  →  s1.domainkey.provider-example.com
s2._domainkey.moorhall.com  →  s2.domainkey.provider-example.com
```

### DMARC (Domain-based Message Authentication)

**Purpose**: Tells receiving servers what to do with emails that fail SPF/DKIM checks.

**Record Type**: TXT
**Host**: `_dmarc`
**Value** (start with monitoring mode):
```
v=DMARC1; p=none; rua=mailto:dmarc-reports@moorhall.com; pct=100
```

**After monitoring** (when you're confident everything works):
```
v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@moorhall.com; pct=100
```

**Strict policy** (recommended after testing):
```
v=DMARC1; p=reject; rua=mailto:dmarc-reports@moorhall.com; pct=100
```

### MX Records

Ensure your domain has proper MX records for receiving email:
```
@  MX  10  mail.moorhall.com
```

### DNS Propagation

DNS changes can take up to 48 hours to propagate globally, but usually complete within a few hours.

---

## Security Best Practices

### Rate Limiting
- Contact form: 5 submissions per 15 minutes per IP
- Forgot password: 3 requests per hour per email
- General email: 10 requests per minute per IP
- Already configured in `email.routes.ts`

### Prevent Email Enumeration
- The forgot password endpoint always returns the same response regardless of whether the email exists
- This prevents attackers from discovering valid email addresses

### Input Sanitization
- All user inputs are validated with Zod schemas
- HTML content is sanitized to prevent XSS
- Email subjects are sanitized to prevent header injection

### Secure Token Handling
- Password reset tokens are hashed before storage (bcrypt)
- Tokens expire after 1 hour
- Single-use tokens (invalidated after use)

### Environment Variables
- Never commit `.env` files to version control
- Use Netlify Dashboard environment variable management in production
- Use different credentials for development and production

### HTTPS Only
- All email links use HTTPS
- Cookies are set with `secure: true` in production
- SameSite cookie policy enforced

---

## Troubleshooting

### Common Issues

#### 1. "Invalid login: 534" (Gmail)
**Cause**: Google blocked the sign-in attempt.
**Solution**: Switch to a transactional provider.

#### 2. "Connection timeout" on Netlify
**Cause**: SMTP server is unreachable from Netlify's network.
**Solution**:
- Verify SMTP_HOST and SMTP_PORT are correct
- Check if the SMTP provider allows connections from Netlify edge locations
- Ensure your SMTP provider is accessible from cloud environments
- Try enabling/disabling TLS

#### 3. "Authentication failed"
**Cause**: Invalid SMTP credentials.
**Solution**:
- Double-check username and password in environment variables
- For providers that provide SMTP keys: use the SMTP key, not your login password
- Regenerate credentials if needed

#### 4. Emails going to spam
**Cause**: Missing or misconfigured DNS records.
**Solution**:
- Set up SPF, DKIM, and DMARC records
- Verify your sender domain with your transactional provider
- Use a consistent "from" address

#### 5. Emails not sending in development
**Cause**: SMTP credentials not set or wrong provider selected.
**Solution**:
- Use Mailtrap for development
- Check that `.env` file exists and has correct values
- Check terminal output for connection errors

#### 6. Rate limiting errors
**Cause**: Too many email requests.
**Solution**:
- Wait for the rate limit window to reset
- Adjust rate limits in `email.routes.ts` if needed
- For high-volume: upgrade your SMTP plan

### Health Check Endpoint

Use the health check to verify email connectivity:

```bash
curl -X GET https://your-api.com/api/v1/emails/health \
  -H "Authorization: Bearer <your-token>"
```

Expected response:
```json
{
  "success": true,
  "message": "Email health check completed",
  "data": {
    "primary": true,
    "fallback": true
  }
}
```

### Testing Checklist

- [ ] Transactional provider / Mailtrap account created
- [ ] SMTP credentials configurein Netlify Dashboardv`
- [ ] Environment variables set on Render
- [ ] DNS records (SPF, DKIM, DMARC) configured
- [ ] Test email sent successfully
- [ ] Health check endpoint returns healthy status
- [ ] Rate limiting works correctly
- [ ] Error handling works (invalid emails rejected)
- [ ] Auto-reply sends correctly
- [ ] All templates render correctly in different email clients

---

## API Reference

### POST /api/v1/emails/contact

Send a contact form submission.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subject": "Partnership Inquiry",
  "message": "Hello, I would like to discuss a partnership..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Your message has been sent successfully. A confirmation email has been sent to your inbox."
}
```

### POST /api/v1/emails/welcome

Send a welcome email to a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "fullName": "New User"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome email sent successfully"
}
```

### POST /api/v1/emails/forgot-password

Request a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### POST /api/v1/emails/reset-success

Send password reset confirmation. *(Requires authentication)*

**Request Body:**
```json
{
  "email": "user@example.com",
  "fullName": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset confirmation email sent successfully"
}
```

### GET /api/v1/emails/health

Check email service health. *(Requires authentication)*

**Response:**
```json
{
  "success": true,
  "data": {
    "primary": true,
    "fallback": true
  }
}