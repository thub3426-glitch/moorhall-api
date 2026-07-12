# Quick Start: Netlify Deployment in 10 Minutes

This guide provides a fast-track setup for deploying the MoorHall API to Netlify in under 10 minutes.

## Prerequisites (2 minutes)

1. **GitHub Repository** - Code pushed to GitHub
2. **Netlify Account** - Free account at [app.netlify.com](https://app.netlify.com)
3. **Node.js 20+** - Installed locally
4. **PostgreSQL Database** - Local or cloud-hosted (Supabase recommended)

## Step-by-Step Setup (8 minutes)

### 1. Prepare Code Locally (1 minute)

```bash
# Clone repository
git clone <your-repo-url>
cd moor-hall-api

# Verify build works
npm install
npm run build

# Verify it passes
# You should see: dist/ folder created successfully
```

### 2. Create Netlify Site (2 minutes)

```bash
# Option A: Via Dashboard (Recommended)
# 1. Go to https://app.netlify.com
# 2. Click "Add new site" → "Import an existing project"
# 3. Select GitHub
# 4. Authorize and select your repository
# 5. Click "Deploy site"

# Option B: Via CLI
npm install -g netlify-cli
netlify login
netlify init
# Select: "Create & configure a new site"
# Select: GitHub for git provider
```

### 3. Set Environment Variables (3 minutes)

In Netlify Dashboard: **Site settings** → **Build & deploy** → **Environment**

**Click "Edit variables" and add:**

```
DATABASE_URL = postgresql://user:password@host:5432/db?sslmode=require
JWT_SECRET = (generate: openssl rand -hex 32)
SESSION_SECRET = (generate: openssl rand -hex 32)
CORS_ORIGINS = https://yourdomain.com
CLOUDINARY_NAME = your-name
CLOUDINARY_API_KEY = your-key
CLOUDINARY_API_SECRET = your-secret
SENDGRID_API_KEY = SG.your-key
SENDGRID_FROM_EMAIL = noreply@yourdomain.com
ENVIRONMENT = production
```

### 4. Redeploy (1 minute)

1. Go to **Deploys** tab
2. Find latest deploy
3. Click menu (...) → **Trigger deploy**
4. Wait for green checkmark ✅

### 5. Verify Deployment (1 minute)

```bash
# Test health endpoint
curl https://your-site-name.netlify.app/health

# Should respond:
# {"status": "ok", "timestamp": "..."}

# View logs
netlify functions:invoke api --local

# Or check in Dashboard: Functions → api → Logs
```

## Done! ✅

Your API is now live on Netlify.

### Next Steps

- [ ] Add custom domain (See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md#1-custom-domain-setup))
- [ ] Configure automatic deployments (already set up!)
- [ ] Set up monitoring and alerts
- [ ] Test all endpoints
- [ ] Configure CI/CD pipeline (optional)

## Troubleshooting

### Build Fails
```bash
# Check logs in Netlify Dashboard → Deploys → Select failed deploy

# Try locally
npm run build

# Install missing dependencies if needed
npm install

# Commit and push again
git add .
git commit -m "Fix build"
git push
```

### Deployment Succeeds but API Returns 500
1. Check Functions logs: Dashboard → Functions → api → Logs
2. Verify all environment variables are set
3. Check database connection: `psql $DATABASE_URL_PROD -c "SELECT 1"`
4. Redeploy after any changes

### Can't Connect to Database
1. Verify DATABASE_URL format: `postgresql://user:pass@host:5432/db?sslmode=require`
2. Test locally: `psql $DATABASE_URL -c "SELECT 1"`
3. Ensure database accepts connections from Netlify (check firewall rules)
4. For cloud databases, use IP allowlisting (if provided by provider)

## Common Commands

```bash
# View environment variables
netlify env:list

# Set/update environment variable
netlify env:set VAR_NAME "value"

# Trigger redeploy
netlify deploy --prod --dir=dist

# View function logs
netlify functions:invoke api

# Open Netlify dashboard
netlify open:admin
```

---

**For detailed information**, see [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)
