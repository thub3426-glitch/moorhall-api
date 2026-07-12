# Environment Setup Guide for Netlify Deployment

## Overview
This guide provides step-by-step instructions for setting up environment variables and configurations needed for successful deployment to Netlify.

## Table of Contents
1. [Local Development Environment](#local-development-environment)
2. [Netlify Production Environment](#netlify-production-environment)
3. [Database Setup](#database-setup)
4. [Third-party Services](#third-party-services)
5. [Verification Checklist](#verification-checklist)

---

## Local Development Environment

### Step 1: Create .env File

In the project root directory, create a `.env` file based on `.env.example`:

```bash
cd moor-hall-api
cp .env.example .env
```

### Step 2: Configure Required Variables

Edit `.env` with the following critical variables:

#### Server Configuration
```env
PORT=3005
NODE_ENV=development
ENVIRONMENT=development
API_PATH=/api/v1
```

#### Database (Local Development)
```env
# For local PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/moorhall_dev"

# Or for cloud PostgreSQL (Supabase, Railway, etc.)
DATABASE_URL="postgresql://user:password@db.region.provider.com:5432/moorhall?sslmode=require"
```

#### Authentication
```env
# Generate a strong random key (min 32 characters)
JWT_SECRET="your-random-secret-key-min-32-chars-generated-securely"
JWT_EXPIRES_IN=7d
SESSION_SECRET="another-random-secret-key"
```

**Generate secure secrets:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

#### CORS Configuration
```env
# Development (multiple localhost ports)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Note: Update this for each frontend domain you use
```

#### Cloudinary (Image Upload)
```env
CLOUDINARY_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**How to get Cloudinary credentials:**
1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Go to Dashboard → Settings
3. Copy Cloud Name, API Key, API Secret
4. Never share the API Secret in frontend code

#### Email (SendGrid)
```env
SENDGRID_API_KEY=SG.your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@moorhall.com
SENDGRID_FROM_NAME=MoorHall
```

**How to get SendGrid API key:**
1. Create account at [sendgrid.com](https://sendgrid.com/)
2. Settings → API Keys → Create API Key
3. Set permissions appropriately
4. Use only in backend (never in frontend)

#### WhatsApp (Optional - if using WhatsApp integration)
```env
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_BUSINESS_ACCOUNT_ID=your-account-id
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token
```

#### Stripe (Optional - if using payment processing)
```env
STRIPE_SECRET_KEY=sk_test_your-test-key-for-development
STRIPE_PUBLISHABLE_KEY=pk_test_your-test-key
STRIPE_WEBHOOK_SECRET=whsec_test_your-secret
```

### Step 3: Verify Local Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Test database connection
npm run db:push

# Start development server
npm run dev

# Verify server is running
curl http://localhost:3005/health

# Check Swagger docs
# Open browser: http://localhost:3005/api-docs
```

### Step 4: Test API Locally

```bash
# Test root endpoint
curl http://localhost:3005/

# Test health check
curl http://localhost:3005/health

# Test API endpoint (example)
curl http://localhost:3005/api/v1/categories \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Netlify Production Environment

### Step 1: Create Netlify Site

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site"
3. Choose "Import an existing project"
4. Select GitHub repository
5. Accept defaults for build command and publish directory (they're in netlify.toml)
6. Click "Deploy site"

### Step 2: Add Environment Variables

**CRITICAL: Do not commit `.env` to Git. Set ALL variables in Netlify Dashboard.**

In Netlify Dashboard:
1. Navigate to: **Site settings** → **Build & deploy** → **Environment**
2. Click **"Edit variables"**
3. Add each variable:

#### Required for All Deployments
```
DATABASE_URL = postgresql://user:password@host:5432/database?sslmode=require
JWT_SECRET = (use secure generated value)
SESSION_SECRET = (use secure generated value)
CORS_ORIGINS = https://yourdomain.com,https://admin.yourdomain.com
```

#### Cloudinary Integration
```
CLOUDINARY_NAME = your-cloud-name
CLOUDINARY_API_KEY = your-api-key
CLOUDINARY_API_SECRET = your-api-secret
```

#### Email Service
```
SENDGRID_API_KEY = SG.your-key
SENDGRID_FROM_EMAIL = noreply@yourdomain.com
SENDGRID_FROM_NAME = Your App Name
```

#### Optional Services
```
WHATSAPP_API_KEY = your-key
STRIPE_SECRET_KEY = sk_live_your-production-key
```

#### Feature Flags
```
ENABLE_SWAGGER_DOCS = false (disable in production)
ENABLE_RATE_LIMITING = true
ENABLE_CORS = true
```

#### Netlify-Specific
```
ENVIRONMENT = production
NODE_ENV = production
```

### Step 3: Redeploy with Environment Variables

After adding all variables:
1. Go to **Deploys** tab
2. Find the latest deploy
3. Click the three dots (...) menu
4. Select **"Trigger deploy"**
5. Wait for deployment to complete

### Step 4: Verify Production Deployment

```bash
# Test production API
curl https://yourdomain.com/health

# Check function logs
netlify functions:invoke api

# View in Netlify Dashboard
# Navigate to: Functions → api → Logs
```

---

## Database Setup

### Option 1: Supabase (Recommended - Free PostgreSQL)

**Advantages**: Free tier, generous limits, built-in backups

1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub
3. Create a new project (select region closest to you)
4. Go to **Settings** → **Database**
5. Copy **Connection string** (URI format)
6. Set in environment:
   ```
   DATABASE_URL = (paste URI with sslmode=require)
   ```

### Option 2: Railway (Simple PostgreSQL)

**Advantages**: Easy setup, good free tier

1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Click PostgreSQL plugin
4. Go to **Variables** tab
5. Copy DATABASE_URL
6. Set in environment

### Option 3: AWS RDS

**Advantages**: Production-grade, highly reliable

1. AWS Console → RDS → Create database
2. Engine: PostgreSQL
3. Instance class: db.t3.micro (free tier)
4. Configure security group to allow Netlify access
5. Get connection string from Connectivity section
6. Set in environment with SSL

### Option 4: Local PostgreSQL (Development Only)

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Linux (Ubuntu)
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start

# Windows
# Download from postgresql.org, run installer

# Create database
createdb moorhall_dev

# Connect and verify
psql moorhall_dev

# Set CONNECTION
DATABASE_URL="postgresql://user:password@localhost:5432/moorhall_dev"
```

### Database Migrations

After setting DATABASE_URL, run migrations:

```bash
# Local development
npm run db:push
npm run db:migrate

# Production (on Netlify)
# This can be automated with build hooks or manual triggers
npm run db:prod
```

**For Netlify**: Add to build command or setup Build Hook:
```bash
npm run db:generate && npm run db:prod && npm run build
```

---

## Third-party Services

### Cloudinary (Image Upload)

1. Sign up at [cloudinary.com](https://cloudinary.com/users/register/free)
2. Dashboard → Settings → Scroll to API Keys section
3. Copy: Cloud Name, API Key, API Secret
4. Set in environment variables

**Test upload:**
```bash
curl -X POST \
  -F "file=@./test-image.jpg" \
  -F "upload_preset=your_preset" \
  https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload
```

### SendGrid (Email Service)

1. Sign up at [sendgrid.com](https://sendgrid.com/users/register)
2. Settings → API Keys → Create API Key
3. Name it "Production" or "Development"
4. Copy the key (shown only once)
5. Set `SENDGRID_API_KEY` in environment

**Verify sender:**
1. Settings → Sender Authentication
2. Add verified email or domain
3. Use verified email in `SENDGRID_FROM_EMAIL`

### WhatsApp Business API (Optional)

1. Sign up at [developers.facebook.com](https://developers.facebook.com)
2. Create Business App
3. Add WhatsApp product
4. Get Access Token and Phone Number ID
5. Set in environment variables

### Stripe (Payment Processing - Optional)

1. Sign up at [stripe.com](https://stripe.com)
2. Dashboard → API keys
3. Use test keys for development
4. Use live keys for production
5. Copy Secret Key to environment

---

## Verification Checklist

### Local Development Checklist
- [ ] `.env` file created and populated
- [ ] `npm install` completed successfully
- [ ] Prisma client generated: `npm run db:generate`
- [ ] Database connection working: `npm run db:push`
- [ ] Development server starts: `npm run dev`
- [ ] Health endpoint responds: `curl http://localhost:3005/health`
- [ ] Swagger docs accessible: `http://localhost:3005/api-docs`
- [ ] API endpoints working with test requests

### Netlify Deployment Checklist
- [ ] Git repository created and code pushed to GitHub
- [ ] Netlify site created and connected to GitHub
- [ ] `netlify.toml` present in root directory
- [ ] All environment variables set in Netlify Dashboard:
  - [ ] DATABASE_URL
  - [ ] JWT_SECRET
  - [ ] SESSION_SECRET
  - [ ] CORS_ORIGINS
  - [ ] CLOUDINARY_* variables
  - [ ] SENDGRID_* variables
  - [ ] Other required variables
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Functions directory: `netlify/functions`
- [ ] Redeployed after setting variables
- [ ] Deployment logs show success
- [ ] Health endpoint responds: `curl https://yourdomain.com/health`
- [ ] API endpoints working

### Production Readiness Checklist
- [ ] SSL certificate installed (automatic on Netlify)
- [ ] HTTPS enforced (redirect http → https)
- [ ] Security headers configured
- [ ] CORS origins restricted (not wildcard)
- [ ] JWT secrets are strong (32+ characters)
- [ ] Database backups enabled
- [ ] Error logging configured
- [ ] Monitoring/alerts set up
- [ ] Rate limiting enabled
- [ ] All sensitive values in environment (not in code)
- [ ] `.env` in `.gitignore`

---

## Troubleshooting Environment Setup

### Problem: "DATABASE_URL not set"

**Solution**:
```bash
# Verify in Netlify Dashboard
netlify env:list

# Set if missing
netlify env:set DATABASE_URL "your-connection-string"

# Redeploy
netlify deploy --prod --dir=dist
```

### Problem: "Cannot connect to database"

**Check**:
```bash
# Test connection locally
psql $DATABASE_URL -c "SELECT 1"

# Verify connection string format
# Should be: postgresql://user:pass@host:port/dbname

# For cloud databases, ensure SSL is used
# CONNECTION_STRING should end with ?sslmode=require
```

### Problem: "JWT Secret not configured"

**Solution**:
```bash
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set in Netlify
netlify env:set JWT_SECRET "your-generated-value"
```

### Problem: "CORS errors in browser"

**Solution**:
```env
# Exact frontend domain (case-sensitive)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# NOT: https://*.yourdomain.com (wildcards don't work)
# NOT: * (security risk)
```

### Problem: "Cloudinary upload fails"

**Check**:
```bash
# Verify credentials
echo $CLOUDINARY_NAME
echo $CLOUDINARY_API_KEY

# Test upload with curl
curl -u "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET" \
  https://api.cloudinary.com/v1_1/$CLOUDINARY_NAME/resources
```

---

## Security Best Practices for Environment Variables

✅ **DO**:
- Use strong, random secrets (minimum 32 characters)
- Rotate secrets periodically
- Use different secrets for dev and production
- Store only in Netlify Dashboard (for production)
- Use `.gitignore` to prevent `.env` commits
- Enable webhook verification tokens
- Use SSL connections (add ?sslmode=require)

❌ **DON'T**:
- Commit `.env` files to Git
- Use weak or predictable secrets
- Share secrets via email or Slack
- Use same secret for multiple environments
- Log secrets in console
- Expose secrets in error messages

---

## Quick Reference

### Generate Secure Secrets
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32

# Linux/Mac
head -c 32 /dev/urandom | xxd -p
```

### Test Environment Variables
```bash
# Verify variable is set
echo $DATABASE_URL

# List all set variables
netlify env:list

# Set new variable
netlify env:set VAR_NAME "value"

# Delete variable
netlify env:unset VAR_NAME
```

### Common Environment Variables Needed

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| DATABASE_URL | Database connection | Yes | postgresql://... |
| JWT_SECRET | Token signing | Yes | (random hex string) |
| SESSION_SECRET | Session cookie signing | Yes | (random hex string) |
| CORS_ORIGINS | Allowed frontend domains | Yes | https://yourdomain.com |
| CLOUDINARY_NAME | Image service | If using uploads | your-cloud-name |
| CLOUDINARY_API_KEY | Cloudinary authentication | If using uploads | (from dashboard) |
| CLOUDINARY_API_SECRET | Cloudinary secret | If using uploads | (from dashboard) |
| SENDGRID_API_KEY | Email service | If using email | SG.(key) |
| SENDGRID_FROM_EMAIL | Email sender | If using email | noreply@domain.com |
| WHATSAPP_API_KEY | WhatsApp integration | If using WhatsApp | (from Meta) |

---

## Next Steps

1. ✅ Set up local `.env` file
2. ✅ Test locally with `npm run dev`
3. ✅ Create Netlify site
4. ✅ Set all environment variables in Netlify Dashboard
5. ✅ Deploy and verify
6. ✅ Monitor logs for any issues
7. ✅ Set up custom domain and SSL
8. ✅ Configure monitoring and alerts

---

**Last Updated**: June 2026
**Status**: Complete ✅
