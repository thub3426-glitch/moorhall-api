# Netlify Deployment Guide for MoorHall API

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Architecture](#project-architecture)
3. [Local Development Setup](#local-development-setup)
4. [Environment Variables](#environment-variables)
5. [Building the Project](#building-the-project)
6. [Deploying to Netlify](#deploying-to-netlify)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Monitoring & Debugging](#monitoring--debugging)
9. [Troubleshooting](#troubleshooting)
10. [Production Best Practices](#production-best-practices)

---

## Prerequisites

Before deploying to Netlify, ensure you have:

- **Node.js 20+** installed ([download](https://nodejs.org/))
- **Git** installed and repository pushed to GitHub
- **Netlify Account** ([create free account](https://app.netlify.com/signup))
- **npm** or **yarn** package manager
- **PostgreSQL Database** (local or cloud-hosted)

Required services accounts:
- PostgreSQL database (Supabase, Railway, AWS RDS, or self-hosted)
- Cloudinary account for image uploads
- SendGrid or SMTP server for emails
- WhatsApp Business API (if using WhatsApp integration)
- Stripe (if using payment processing)

---

## Project Architecture

### Current Setup
This is a production-ready Express.js backend with:
- **TypeScript** for type safety
- **Prisma ORM** for database operations
- **Express.js** API framework
- **JWT Authentication** for secure endpoints
- **Swagger/OpenAPI** documentation
- **Comprehensive middleware** (CORS, security, logging)
- **Multiple integrations** (Cloudinary, SendGrid, WhatsApp)

### Build Output
- **Source**: `src/` (TypeScript)
- **Compiled**: `dist/` (JavaScript)
- **Start file**: `dist/index.js`

### Deployment Target
The application is configured to deploy to Netlify with the following structure:
```
netlify/
├── functions/
│   └── api.ts              # Serverless function handler
└── edge-functions/         # (Optional) Edge functions
netlify.toml                # Netlify configuration
```

---

## Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd moor-hall-api

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate
```

### 2. Setup Database

#### Option A: Local PostgreSQL
```bash
# Ensure PostgreSQL is running
# Create a new database
createdb moorhall_dev

# Set DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/moorhall_dev"

# Run migrations
npm run db:push
```

#### Option B: Cloud Database (Recommended)
Use services like:
- **Supabase** (PostgreSQL hosted, free tier available)
- **Railway** (Simple PostgreSQL deployment)
- **AWS RDS** (Fully managed)

Get the connection string and set it in `.env`:
```
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### 3. Configure Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit .env with your values (see Environment Variables section)
nano .env
```

### 4. Start Development Server

```bash
# Start with hot-reload (uses nodemon)
npm run dev

# Server runs on http://localhost:3005
# Swagger docs: http://localhost:3005/api-docs
# Health check: http://localhost:3005/health
```

### 5. Test Locally

```bash
# Run tests (when configured)
npm run test

# Build for production
npm run build

# Start production build
npm run start
```

---

## Environment Variables

### Local Development (.env file)
Create a `.env` file in the root directory:

```env
# Server
PORT=3005
NODE_ENV=development
API_PATH=/api/v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/moorhall_dev

# Authentication
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Cloudinary
CLOUDINARY_NAME=your-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Email
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@moorhall.com

# WhatsApp (if using)
WHATSAPP_API_KEY=your-key
WHATSAPP_BUSINESS_ACCOUNT_ID=your-id

# Feature flags
ENABLE_SWAGGER_DOCS=true
ENABLE_RATE_LIMITING=true
```

### Production on Netlify

**IMPORTANT**: Never commit `.env` to Git. Set variables in Netlify Dashboard instead.

#### Steps to Configure in Netlify:

1. **Go to Netlify Dashboard**
2. **Select your site**
3. **Navigate**: Site Settings → Build & Deploy → Environment
4. **Add environment variables** (click "Edit variables")

Add all production values:
```
DATABASE_URL = your-production-db-url
JWT_SECRET = your-production-jwt-secret
CORS_ORIGINS = https://yourdomain.com,https://admin.yourdomain.com
CLOUDINARY_NAME = your-production-cloudinary
CLOUDINARY_API_KEY = your-key
CLOUDINARY_API_SECRET = your-secret
SENDGRID_API_KEY = your-production-key
ENABLE_SWAGGER_DOCS = false  # Disable in production
ENVIRONMENT = production
```

### Using .env.production

Alternatively, create `.env.production` file (also add to `.gitignore`):
```bash
# This will be loaded automatically by dotenv
# But NEVER commit this to Git
```

---

## Building the Project

### Development Build
```bash
npm run build
# Output: Creates `dist/` directory with compiled code
```

### Watch Mode (for development)
```bash
npm run dev
# Automatically rebuilds on file changes
```

### Database Migrations
```bash
# Push schema changes to database
npm run db:push

# Run migrations
npm run db:migrate

# Generate Prisma Client
npm run db:generate

# Production deployment (apply pending migrations)
npm run db:prod
```

---

## Deploying to Netlify

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Authorize Netlify to access your GitHub account
   - Select your repository
   - Choose branch (usually `main`)

3. **Configure Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions` (auto-detected from netlify.toml)
   - Click "Deploy site"

4. **Set Environment Variables** (IMPORTANT)
   - After site is created, go to Settings → Build & Deploy → Environment
   - Add all environment variables (see Environment Variables section)
   - **Redeploy** the site to apply new variables

5. **Deploy**
   - Go back to "Deploys" tab
   - Click "Deploy site" or "Trigger deploy"

### Method 2: Netlify CLI (Manual)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build the project
npm run build

# Deploy
netlify deploy --prod --dir=dist

# Set environment variables
netlify env:set DATABASE_URL "your-url"
netlify env:set JWT_SECRET "your-secret"
# ... set all other variables

# Trigger a new build
netlify deploy --prod --dir=dist
```

### Method 3: Using Netlify Compose (for complex setups)

Create `netlify.compose.json` for multi-site deployments if needed.

---

## Post-Deployment Configuration

### 1. Custom Domain Setup

1. **Purchase domain** (or use existing)
2. **Go to Netlify Site Settings**
3. **Domain management** → **Add custom domain**
4. **Update DNS records** (Netlify provides instructions):
   - For Netlify DNS: Transfer domain nameservers
   - For external DNS: Add CNAME or A records

Example DNS records:
```
CNAME  example.com → your-site.netlify.app
CNAME  www.example.com → your-site.netlify.app
```

### 2. SSL/HTTPS Certificate

- Netlify **automatically** provisions SSL via Let's Encrypt
- **HSTS** is pre-configured for maximum security
- Automatic certificate renewal happens every 30 days
- Access via: https://yourdomain.com

### 3. Configure CORS

Update in Netlify environment variables:
```
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com
```

This is also reflected in `netlify.toml`:
```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://yourdomain.com"
```

### 4. Setup Monitoring & Alerts

1. **Netlify Analytics**
   - Enable in Site Settings → Analytics
   
2. **Function Logging**
   - View logs: Functions tab → any function
   - Real-time logs for debugging

3. **Email Notifications**
   - Site Settings → Notifications
   - Enable deploy notifications

### 5. Database Connection Optimization for Netlify Functions

For serverless on Netlify, connection pooling is **CRITICAL**. Each function invocation is a separate Node.js process.

#### Connection Pooling Configuration

Update your `DATABASE_URL` to include pooling parameters:

```
postgresql://user:password@host:port/database?schema=public&sslmode=require&pool_size=2&connection_limit=2
```

**Parameters explained:**
- `schema=public` - Target schema
- `sslmode=require` - Encrypt connection (required for cloud databases)
- `pool_size=2` - Connections to maintain in pool (low for serverless)
- `connection_limit=2` - Maximum connections per process (prevent exhaustion)

#### Recommended Database Providers with Built-in Pooling

1. **Supabase** (Recommended)
   - Use connection pooler: `[project].pooler.supabase.com:6432` (not `.postgres.supabase.com`)
   - Example: `postgresql://postgres:pass@project.pooler.supabase.com:6432/postgres?schema=public&sslmode=require&pool_size=2`

2. **Railway**
   - Automatically includes proper pooling parameters
   - Just use provided DATABASE_URL as-is

3. **AWS RDS**
   - Use RDS Proxy for connection pooling
   - Endpoint: `[proxy-endpoint]:6432`

4. **Self-Hosted PostgreSQL**
   - Deploy PgBouncer in front of database
   - Configure connection limits

#### Prisma Client Configuration

The MoorHall API uses a singleton pattern for connection reuse:

```typescript
// src/config/db.ts
const prismaProxy = new Proxy(
  {},
  {
    get(_target, prop: string | symbol) {
      const client = initPrisma();
      // Connection is reused across requests in same function instance
      // ...
    }
  }
);
```

This ensures:
- ✅ Connections are reused within function lifetime
- ✅ Automatic connection pooling via DATABASE_URL parameters
- ✅ Lazy initialization (connects only when needed)
- ✅ Works seamlessly with Netlify Functions

#### Build-Time Prisma Client Generation

During Netlify build, Prisma client must be generated:

```bash
# netlify.toml includes this in build command:
npm run db:generate
```

**Important:** DATABASE_URL must be set in Netlify build environment variables, even if it's different from production. This allows:
- ✅ Prisma client generation during build
- ✅ Type-safe queries at compile time
- ✅ Migration checking

---

## Monitoring & Debugging

### 1. View Function Logs

```bash
# Using Netlify CLI
netlify functions:invoke api --local

# Or check logs in Netlify Dashboard:
# Your Site → Functions → Select function → Logs
```

### 2. Check Build Logs

In Netlify Dashboard:
- **Deploys** tab → Select deploy → **Deploy log**
- Shows all build steps and errors

### 3. Monitor Performance

- **Lighthouse**: Netlify runs automated Lighthouse audits
- **Analytics**: View in Netlify Dashboard
- **Metrics**: Response times, error rates

### 4. Real-time Monitoring

```bash
# Stream logs from deployed function
netlify functions:invoke api --local

# Or use Netlify Dashboard live logs
```

### 5. Error Tracking

Netlify automatically captures:
- Function errors
- Build failures
- Timeout errors
- Memory limit exceptions

Errors are logged and visible in Netlify Dashboard.

---

## Troubleshooting

### Problem: Build Fails

**Solution**:
1. Check build logs in Netlify Dashboard
2. Ensure Node version matches: `NODE_VERSION=20`
3. Verify all dependencies: `npm install`
4. Try building locally: `npm run build`

### Problem: "Function timeout" Error

**Causes**: Cold starts, slow database queries, external API calls

**Solutions**:
```toml
# In netlify.toml, increase timeout (if on higher plan):
[functions]
  timeout = 30  # seconds
```

- Use connection pooling for database
- Optimize database queries
- Add caching for frequent queries

### Problem: Database Connection Errors

**Check**:
1. DATABASE_URL is set in Netlify environment
2. Database is accessible from Netlify (not behind firewall)
3. Connection string is correct
4. Database user has sufficient permissions

```bash
# Test database connection locally with production string:
psql $DATABASE_URL_PROD -c "SELECT 1"
```

### Problem: CORS Errors

**Check**:
1. CORS_ORIGINS matches your frontend domain
2. Frontend and backend are on different domains
3. Credentials in CORS config

**Fix** in environment:
```
CORS_ORIGINS=https://frontend.com,https://admin.frontend.com
```

### Problem: 502 Bad Gateway

**Causes**:
- Function execution time exceeded
- Out of memory
- Unhandled exception in function
- Database connection pool exhausted

**Solutions**:
1. Check function logs in Netlify Dashboard
2. Add error handling to API endpoints
3. Optimize database queries
4. Use connection pooling

### Problem: Build succeeds but site shows "Page not found"

**Check**:
1. Publish directory is set to `dist`
2. Build command is `npm run build`
3. `dist/` folder contains files after build

```bash
# Verify locally
npm run build
ls -la dist/
```

### Problem: Environment Variables Not Working

**Solution**:
1. Set in Netlify Dashboard (not in file)
2. **Redeploy** after adding variables
3. Verify variable name spelling (case-sensitive)
4. Check variable values don't have extra spaces

```bash
# View set variables
netlify env:list
```

---

## Production Best Practices

### Security

✅ **DO**:
- Use strong JWT secrets (minimum 32 characters)
- Enable HTTPS (automatic on Netlify)
- Set secure CORS origins
- Use environment variables for secrets
- Enable rate limiting
- Add security headers (pre-configured in `netlify.toml`)
- Keep dependencies updated

```bash
# Check for vulnerabilities
npm audit

# Update packages safely
npm update
```

❌ **DON'T**:
- Commit `.env` files to Git
- Use weak secrets
- Disable HTTPS
- Allow wildcard CORS origins in production
- Log sensitive data
- Use `eval()` or `Function()` constructor

### Database

- Use connection pooling (Prisma handles this)
- Enable SSL connections: `sslmode=require` in connection string
- Regular backups (automated by most providers)
- Monitor connection limits
- Optimize indexes for common queries

```prisma
// Example with SSL
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // PostgreSQL will use SSL automatically with ?sslmode=require
}
```

### Performance

✅ Optimize:
- Database query efficiency
- API response times
- Asset caching headers
- Middleware execution order

```bash
# Monitor in Netlify Analytics
# Target: <200ms average response time
```

### Logging & Monitoring

```javascript
// Good error logging
app.use((err, req, res, next) => {
  console.error('Error:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    status: err.status || 500,
    message: err.message,
  });
  // Send to error tracking service
});
```

### Database Migrations

For production deployments:

```bash
# Always test migrations locally first
npm run db:push

# Before deploying, ensure backup exists
# Netlify will automatically run migrations if configured
# (add to build command or setup webhook)
```

In `package.json`:
```json
{
  "scripts": {
    "build": "npm run db:generate && tsc && node fix-imports.js",
    "db:migrate:deploy": "prisma migrate deploy"
  }
}
```

Or add to build command in `netlify.toml`:
```toml
[build]
  command = "npm run db:generate && tsc && node fix-imports.js"
```

### Scaling Considerations

- Netlify Functions auto-scale (handled by Netlify)
- Monitor concurrent function executions
- Use connection pooling for database
- Implement caching strategies
- Consider upgrading plan if hitting limits

---

## Useful Commands & Resources

### Netlify CLI Commands
```bash
# Deploy
netlify deploy --prod --dir=dist

# View logs
netlify functions:invoke api

# Set environment variables
netlify env:set VAR_NAME "value"

# Monitor in real-time
netlify dev

# Open dashboard
netlify open:admin
```

### Database Commands
```bash
# Prisma
npm run db:push              # Push schema changes
npm run db:migrate           # Create migration
npm run db:migrate:deploy    # Deploy migration
npm run db:studio            # Visual database browser

# PostgreSQL (if local)
psql -d moorhall_dev -c "SELECT * FROM users;"
```

### Useful Links

- [Netlify Docs](https://docs.netlify.com/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)

---

## Next Steps

1. ✅ Set up local development environment (follow Local Development Setup)
2. ✅ Configure all environment variables
3. ✅ Test application locally
4. ✅ Push code to GitHub
5. ✅ Connect GitHub to Netlify
6. ✅ Set environment variables in Netlify Dashboard
7. ✅ Deploy and monitor
8. ✅ Configure custom domain and SSL
9. ✅ Set up monitoring and alerts
10. ✅ Document any custom configurations

---

## Support & Issues

If you encounter issues:

1. Check Netlify Dashboard for build/deploy logs
2. Review error messages in Functions logs
3. Test locally with `npm run dev`
4. Check `.env` file configuration
5. Verify database connectivity
6. Review security headers configuration

For additional help:
- [Netlify Support](https://support.netlify.com/)
- [Community Forums](https://answers.netlify.com/)
- [GitHub Issues](https://github.com/netlify/netlify-cli/issues)

---

**Last Updated**: June 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
