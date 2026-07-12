# Netlify Configuration Reference

Complete reference for all configuration files and settings in the MoorHall API Netlify deployment.

---

## Files Included

### 1. netlify.toml (Primary Configuration)

**Location**: Root directory  
**Purpose**: Main Netlify configuration file  
**Auto-detected**: Yes - Netlify automatically reads this

**Key Sections**:
- `[build]` - Build command and output directory
- `[dev]` - Local development settings
- `[context]` - Environment-specific settings (production, preview, branch-deploy)
- `[[redirects]]` - URL redirects and API routing
- `[[headers]]` - HTTP response headers
- `[functions]` - Serverless function settings

**When to modify**:
- Changing build command
- Adding/removing redirects
- Updating security headers
- Configuring custom domains
- Adjusting function timeout

### 2. .netlifyrc (CLI Configuration)

**Location**: Root directory  
**Purpose**: Netlify CLI configuration for local development  
**Auto-detected**: Yes - When using `netlify dev`

**Key Sections**:
- `[build]` - Build settings for CLI
- `[dev]` - Development server settings
- `[context]` - Environment configurations

**When to modify**:
- Changing local dev port
- Adjusting build command
- Adding CLI options
- Configuring contexts

### 3. netlify/functions/api.ts

**Location**: netlify/functions/  
**Purpose**: Serverless function handler  
**Auto-detected**: Yes - Functions directory in netlify.toml

**What it does**:
- Entry point for all API requests
- Handles CORS preflight requests
- Routes requests to Express app
- Error handling and logging

**When to modify**:
- Adding custom middleware
- Implementing edge functions
- Changing request routing
- Adding authentication middleware

### 4. .github/workflows/netlify-deploy.yml

**Location**: .github/workflows/  
**Purpose**: GitHub Actions CI/CD pipeline  
**Trigger**: Push to main/develop, or pull requests

**What it does**:
- Runs tests and linting
- Performs security checks
- Builds project
- Deploys to Netlify (on main branch)
- Verifies deployment success

**When to modify**:
- Changing test commands
- Adding security checks
- Modifying deployment logic
- Adjusting build steps

---

## Configuration Options

### netlify.toml - Build Section

```toml
[build]
  command = "npm run build"              # Build command to run
  publish = "dist"                       # Output directory to deploy
  functions = "netlify/functions"        # Serverless functions directory
  environment = { NODE_VERSION = "20" }  # Environment variables for build
```

| Setting | Value | Purpose |
|---------|-------|---------|
| `command` | `npm run build` | Compiles TypeScript to JavaScript |
| `publish` | `dist` | Directory containing compiled API |
| `functions` | `netlify/functions` | Location of serverless functions |
| `NODE_VERSION` | `20` | Node.js runtime version |

### netlify.toml - Dev Section

```toml
[dev]
  command = "npm run dev"               # Dev server command
  port = 3005                           # Local development port
  framework = "other"                   # Framework detection
  publish = "dist"                      # Output directory
  functions = "netlify/functions"       # Functions directory
```

### netlify.toml - Context Sections

```toml
[context.production]  # Production environment
[context.deploy-preview]  # Pull request previews
[context.branch-deploy]  # Branch deployments
```

Each context can override:
- `command` - Build command
- `publish` - Publish directory
- `environment` - Environment variables
- Other settings

### netlify.toml - Headers

Security headers configured:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `SAMEORIGIN` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | XSS protection |
| `Strict-Transport-Security` | `max-age=31536000` | Force HTTPS |
| `Content-Security-Policy` | See netlify.toml | XSS prevention |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer info |

### netlify.toml - Redirects

API routing configured:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200
```

| From Pattern | To | Purpose |
|-------------|----|---------| | `/api/*` | `/.netlify/functions/api/:splat` | Route all API requests to function |
| `/api-docs` | `/.netlify/functions/api/api-docs` | Swagger documentation |
| `/health` | `/.netlify/functions/api/health` | Health check endpoint |

### GitHub Actions - Environment Variables

```yaml
NODE_VERSION: '20'  # Node.js version for CI
```

---

## Environment Variables for Deployment

### Required (Minimal Setup)

| Variable | Type | Example | Where to Set |
|----------|------|---------|-------------|
| `DATABASE_URL` | URL | `postgresql://user:pass@host/db` | Netlify Dashboard |
| `JWT_SECRET` | String | Random hex string (32+ chars) | Netlify Dashboard |
| `SESSION_SECRET` | String | Random hex string (32+ chars) | Netlify Dashboard |
| `CORS_ORIGINS` | CSV | `https://yourdomain.com` | Netlify Dashboard |

### Recommended

| Variable | Type | Example |
|----------|------|---------|
| `CLOUDINARY_NAME` | String | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | String | Your API key |
| `CLOUDINARY_API_SECRET` | String | Your API secret |
| `SENDGRID_API_KEY` | String | SG.xxxxx |
| `SENDGRID_FROM_EMAIL` | Email | noreply@yourdomain.com |
| `ENVIRONMENT` | String | production |
| `NODE_ENV` | String | production |

### Optional

| Variable | Type | Purpose |
|----------|------|---------|
| `WHATSAPP_API_KEY` | String | WhatsApp integration |
| `STRIPE_SECRET_KEY` | String | Payment processing |
| `ENABLE_SWAGGER_DOCS` | Boolean | Include API docs (disable in production) |

---

## Building & Deploying

### Local Development

```bash
# Start dev server
npm run dev

# Or use Netlify CLI
netlify dev

# Both start at http://localhost:3005
```

### Production Build

```bash
# Build locally
npm run build

# Output: dist/ directory with compiled code
```

### Deploy to Netlify

```bash
# Option 1: Automatic (recommended)
git push origin main
# GitHub Actions automatically tests and deploys

# Option 2: Manual via CLI
netlify deploy --prod --dir=dist

# Option 3: Dashboard
# Connect repository → automatic deploy on push
```

---

## Monitoring & Logs

### Build Logs
- **Location**: Netlify Dashboard → Site → Deploys → Select deploy
- **Shows**: Build steps, errors, warnings, output
- **Access**: Anyone with site access

### Function Logs
- **Location**: Netlify Dashboard → Site → Functions → api → Logs
- **Shows**: Real-time function execution logs
- **Access**: Anyone with site access

### Environment Details
- **Location**: Netlify Dashboard → Site → Settings → Build & deploy → Environment
- **Shows**: All set environment variables (values hidden)
- **Redeploy**: Triggered after variable changes

### Analytics
- **Location**: Netlify Dashboard → Site → Analytics
- **Shows**: Traffic, performance, errors, geographic distribution
- **Requires**: Analytics plan (paid or free tier)

---

## Common Modifications

### Change Build Command

1. Edit `netlify.toml`
```toml
[build]
  command = "npm run build"  # Change this line
```

2. Commit and push
3. Netlify automatically rebuilds with new command

### Add Environment Variable

1. Netlify Dashboard → Settings → Build & deploy → Environment
2. Click "Edit variables"
3. Add new variable
4. Click "Save"
5. **Redeploy** site for changes to take effect

### Update Security Headers

1. Edit `netlify.toml`
2. Modify `[[headers]]` sections
3. Commit and push
4. New headers applied to next request

### Modify CORS Origins

1. Netlify Dashboard → Settings → Build & deploy → Environment
2. Update `CORS_ORIGINS` variable
3. Click "Save"
4. **Redeploy** site
5. New origins active immediately

### Change Deploy Context

In `netlify.toml`:
```toml
[context.production]
  command = "npm run build"
  environment = { NODE_VERSION = "20" }

[context.deploy-preview]
  command = "npm run build"
  environment = { NODE_ENV = "preview" }
```

---

## Performance Tuning

### Reduce Cold Starts
- Minimize dependencies
- Use tree-shaking (configured)
- Lazy load non-essential modules

### Improve Response Times
- See [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION.md)
- Use caching headers
- Optimize database queries
- Implement connection pooling

### Monitor Performance
- Netlify Analytics
- Function execution time logs
- Browser DevTools Performance tab

---

## Troubleshooting Configuration

### Build Command Not Executing
- Verify command in `netlify.toml`
- Run locally: `npm run build`
- Check output directory exists
- Look at build logs for errors

### Environment Variables Not Applied
- Verify set in Netlify Dashboard (not in file)
- Check spelling (case-sensitive)
- **Redeploy** after setting
- View with: `netlify env:list`

### Functions Not Routing
- Verify `[[redirects]]` in netlify.toml
- Check function file exists: `netlify/functions/api.ts`
- View function logs for errors
- Redeploy to reset function cache

### Headers Not Applied
- Clear browser cache (Ctrl+Shift+Del)
- Check header syntax in netlify.toml
- Verify `for` pattern matches your endpoints
- Use browser DevTools to inspect response headers

---

## Best Practices

✅ **DO**:
- Use environment variables for secrets
- Keep netlify.toml in version control
- Test build locally before pushing
- Review build logs for warnings
- Monitor function logs regularly
- Keep dependencies updated
- Use specific versions (not `*` or `latest`)

❌ **DON'T**:
- Commit `.env` files
- Hardcode secrets in netlify.toml
- Use overly broad redirects
- Ignore build warnings
- Change configuration frequently
- Leave old functions deployed
- Use wildcard CORS origins

---

## Quick Reference

### File Locations
| File | Location |
|------|----------|
| Build config | `netlify.toml` |
| CLI config | `.netlifyrc` |
| API function | `netlify/functions/api.ts` |
| CI/CD workflow | `.github/workflows/netlify-deploy.yml` |
| Environment template | `.env.example` |

### Key Commands
```bash
# Local development
netlify dev

# Deploy
netlify deploy --prod --dir=dist

# View environment
netlify env:list

# Check site status
netlify open:admin

# View logs
netlify functions:invoke api
```

### Key URLs
- Dashboard: `https://app.netlify.com`
- API Root: `https://your-site.netlify.app/api/v1`
- Health: `https://your-site.netlify.app/health`
- Docs: `https://your-site.netlify.app/api-docs`

---

## Resources

- [netlify.toml Reference](https://docs.netlify.com/configure-builds/file-api-reference/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Build Settings](https://docs.netlify.com/configure-builds/get-started/)
- [Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Headers & Redirects](https://docs.netlify.com/routing/headers/)

---

**Last Updated**: June 2026
**Version**: 1.0.0
**Status**: ✅ Complete Reference
