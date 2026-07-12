# Netlify + Prisma + PostgreSQL Setup Guide

Complete configuration guide for deploying the MoorHall API to Netlify with Prisma ORM and PostgreSQL database.

## Quick Overview

| Component | Technology | Provider |
|-----------|-----------|----------|
| **API Framework** | Express.js v5.2.1 (TypeScript) | Netlify Functions |
| **Database** | PostgreSQL | Supabase, Railway, AWS RDS, or Self-Hosted |
| **ORM** | Prisma v5.22.0 | Client-side ORM with migrations |
| **Deployment** | Netlify Functions | Serverless compute |
| **Runtime** | Node.js 20 LTS | Netlify default |

## Architecture

```
┌─────────────────┐
│   GitHub Repo   │
│  (your code)    │
└────────┬────────┘
         │ (push)
         ▼
┌─────────────────────────────────────┐
│  GitHub Actions CI/CD Pipeline      │
│  ├─ Run tests                       │
│  ├─ Build TypeScript                │
│  ├─ Generate Prisma client          │
│  └─ Push to Netlify                 │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Netlify Build Process              │
│  ├─ npm run db:generate             │
│  ├─ npm run build                   │
│  ├─ Compile TypeScript → dist/      │
│  └─ Deploy dist/ + functions/       │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Netlify Functions (Runtime)        │
│  ├─ netlify/functions/api.ts        │
│  ├─ Express app from dist/server.js │
│  └─ Prisma client (lazy-loaded)     │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  PostgreSQL Database                │
│  ├─ Prisma migrations applied       │
│  ├─ Connection pooling configured   │
│  └─ SSL/TLS encrypted connection    │
└─────────────────────────────────────┘
```

## Database Options for Netlify + Prisma

### 1. Supabase (Recommended for PostgreSQL + Pooling)

**Pros:**
- Built-in connection pooling (PgBouncer)
- Free tier with 500 MB database
- Simple setup with Netlify integration
- Prisma-friendly documentation
- Real-time features available

**Setup:**

1. Create account at [supabase.com](https://supabase.com)
2. Create new PostgreSQL project
3. Get connection string from Settings > Database > Connection String
4. Choose "Connection pooler" version (NOT "Direct connection")
5. Connection string format:
   ```
   postgresql://postgres:[PASSWORD]@[PROJECT].pooler.supabase.com:6432/postgres?schema=public&sslmode=require&pool_size=2
   ```

**Why Connection Pooler:** 
- Netlify Functions can create many concurrent connections
- Each invocation = new Node.js process = new connection
- Connection pooler limits connections to database
- Critical for preventing "too many connections" errors

### 2. Railway

**Pros:**
- Generous free tier ($5/month credits)
- Auto-managed backups
- Easy scaling
- Built-in Redis and other services

**Setup:**

1. Create account at [railway.app](https://railway.app)
2. Create PostgreSQL service
3. Get DATABASE_URL from service variables
4. Format: `postgresql://user:pass@host:port/database?sslmode=require`

### 3. AWS RDS

**Pros:**
- Enterprise-grade reliability
- Auto-scaling, backups, replication
- Multi-AZ deployment
- Fine-grained security controls

**Setup:**

1. Create RDS PostgreSQL instance in AWS Console
2. Enable "Public accessibility" (for Netlify access)
3. Create security group allowing inbound 5432 from Netlify IPs
4. Get endpoint: `[instance-id].c9akciq32.us-east-1.rds.amazonaws.com`
5. Format: `postgresql://admin:password@endpoint:5432/dbname?sslmode=require`

### 4. Self-Hosted PostgreSQL

**Use only if:**
- Running own VPS/server
- Database is on same network as Netlify can access
- You handle backups and maintenance

**Setup:**
- Ensure port 5432 is open to Netlify's IP ranges
- Use connection pooling tool (PgBouncer, pgpool-II)
- Enable SSL/TLS for security

## Step-by-Step Configuration

### Phase 1: Database Setup (Choose One)

#### Option A: Supabase (Easiest)

```bash
# 1. Go to supabase.com
# 2. Create project
# 3. Copy connection pooler URL
# 4. Verify format has:
#    - pool_size=2
#    - connection_limit=2
#    - sslmode=require
```

#### Option B: Railway

```bash
# 1. Go to railway.app
# 2. Create PostgreSQL service
# 3. Copy DATABASE_URL from service
# 4. Add parameters to format:
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require&pool_size=2"
```

### Phase 2: Local Environment Setup

1. **Create `.env` file locally:**

```bash
# Copy .env.example
cp .env.example .env

# Edit .env with your DATABASE_URL
# Example for Supabase:
DATABASE_URL="postgresql://postgres:password@project.pooler.supabase.com:6432/postgres?schema=public&sslmode=require&pool_size=2"

# Other required variables:
JWT_SECRET="your-secure-random-string-here"
SESSION_SECRET="another-secure-random-string"
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
NODE_ENV="development"
```

2. **Install dependencies:**

```bash
npm install
```

3. **Generate Prisma client:**

```bash
npm run db:generate
```

4. **Apply migrations locally (optional, or skip if using existing DB):**

```bash
# Create new migration
npm run db:migrate

# Or push schema changes directly (CAREFUL - can lose data)
npm run db:push

# View database
npm run db:studio
```

5. **Test locally:**

```bash
npm run dev
# Should see: Server running on port 3005
# Check: curl http://localhost:3005/health
```

### Phase 3: Netlify Project Setup

1. **Connect repository to Netlify:**

```bash
# Push code to GitHub
git add .
git commit -m "Add Netlify + Prisma configuration"
git push origin main
```

2. **In Netlify Dashboard:**

   a. **New site from Git:**
   - Click "Add new site" > "Import an existing project"
   - Select GitHub repository
   - Configure build settings:
     - **Build command**: `npm run db:generate && npm run build`
     - **Publish directory**: `dist`
     - **Functions directory**: `netlify/functions`

   b. **Set Environment Variables:**
   - Go to Site settings > Build & deploy > Environment
   - Click "Edit variables"
   - Add each variable:
   
   ```
   DATABASE_URL = postgresql://postgres:PASSWORD@host:6432/postgres?schema=public&sslmode=require&pool_size=2
   JWT_SECRET = your-secret-key (generate with: openssl rand -hex 32)
   SESSION_SECRET = your-session-secret (generate with: openssl rand -hex 32)
   CORS_ORIGINS = https://yourfrontend.com
   NODE_ENV = production
   ENVIRONMENT = production
   ```

   c. **Trigger Deploy:**
   - Site settings > Build & deploy > Trigger deploy > Deploy site
   - Watch deployment logs
   - Should see:
     ```
     $ npm run db:generate
     $ npm run build
     $ Successfully built site
     ```

### Phase 4: Verify Deployment

1. **Check Netlify Function Logs:**

```bash
# In Netlify Dashboard:
# Site > Functions > logs (real-time monitoring)
# Or: netlify logs --function=api
```

2. **Test API endpoints:**

```bash
# Health check
curl https://your-site.netlify.app/health

# API documentation
curl https://your-site.netlify.app/api-docs

# Query database (example)
curl https://your-site.netlify.app/api/customers
```

3. **Verify Prisma is working:**

```bash
# Check Prisma migrations applied
# In Netlify Functions logs, should see no errors

# Query database directly (test)
npm run db:studio  # Locally, to verify connection
```

## Troubleshooting

### Build Fails: "DATABASE_URL not set"

**Problem:** Build process fails when generating Prisma client.

**Solution:**
1. Verify DATABASE_URL is set in Netlify Dashboard environment variables
2. Ensure DATABASE_URL format is correct: `postgresql://...?sslmode=require`
3. Test locally first: `DATABASE_URL="..." npm run db:generate`
4. Rebuild from Netlify Dashboard

### Deploy Succeeds, API Errors: "Cannot find Prisma client"

**Problem:** Netlify Function starts but can't access database.

**Solution:**
1. Verify DATABASE_URL is set (build-time AND runtime)
2. Check connection URL format (must have `?sslmode=require` for cloud DBs)
3. Test connection locally: `psql $DATABASE_URL -c "SELECT 1"`
4. Check Netlify Function logs for specific error

### "Too many connections" Error

**Problem:** Database connection pool exhausted after multiple API calls.

**Causes:**
- DATABASE_URL missing connection pooling parameters
- Connection pooler not configured in database service
- Too many concurrent Lambda executions

**Solution:**
1. Update DATABASE_URL to use connection pooler:
   - Supabase: Use ".pooler.supabase.com" (not ".postgres.supabase.com")
   - AWS RDS: Set up RDS Proxy
   - Self-hosted: Deploy PgBouncer in front of database
2. Add parameters: `?pool_size=2&connection_limit=2`
3. Verify: `echo $DATABASE_URL` shows pooler host

### "Connection refused" at Netlify

**Problem:** Netlify Function can't reach database server.

**Causes:**
- Database not accessible from Netlify's IP ranges
- Firewall blocking connection
- Database server is down
- Wrong host/port in DATABASE_URL

**Solution:**
1. Check database is running: `psql [connection-string] -c "SELECT 1"` (locally)
2. Verify DATABASE_URL host is correct
3. For cloud databases (Supabase, Railway): they're globally accessible, should work
4. For self-hosted: ensure port 5432 is open from Netlify's IPs
5. Check database logs for connection attempts

### Cold Start Performance (>3s first request)

**Problem:** First API request takes >3 seconds.

**Causes:**
- Netlify Function cold start (normal, ~500-1000ms)
- Prisma client initialization (normal on first use, ~200-500ms)
- Database connection establishment (~500-1000ms)
- TypeScript compilation overhead in dist/

**Solution:**
1. This is expected for serverless. Subsequent requests are faster (<100ms)
2. Keep functions "warm" with health check monitoring
3. Implement request caching where possible
4. Use response compression: already in netlify.toml
5. Optimize database queries (add indexes, select specific columns)

## Prisma Workflow with Netlify

### Creating a Migration

```bash
# 1. Update schema in prisma/schema.prisma
# 2. Create migration
npm run db:migrate

# 3. Name the migration (e.g., "add_user_roles")
# 4. Migration is created in prisma/migrations/
# 5. Commit and push
git add prisma/migrations/
git commit -m "Add user roles migration"
git push

# 6. Netlify automatically runs migrations during next deployment
```

### Viewing Database (Prisma Studio)

```bash
# Locally
npm run db:studio
# Opens browser: http://localhost:5555

# To view production database (CAREFUL!):
# Copy production DATABASE_URL from Netlify
# Run locally:
DATABASE_URL="production-url" npm run db:studio
```

### Generating Updated Client

```bash
# After schema changes:
npm run db:generate

# Or automatically on install:
npm install  # postinstall script runs db:generate

# During Netlify build (automatic):
# netlify.toml includes: npm run db:generate
```

## Security Best Practices

1. **Connection Security:**
   - Always use `sslmode=require` in DATABASE_URL
   - Use HTTPS for all API calls
   - Netlify provides free SSL/TLS automatically

2. **Secret Management:**
   - Never commit `.env` to Git
   - Store all secrets in Netlify Dashboard environment variables
   - Rotate secrets periodically (quarterly minimum)

3. **Connection Pooling:**
   - Use managed pooling (Supabase, Railway) when possible
   - Limit pool size to prevent exhaustion: `pool_size=2`
   - Monitor connection count in database dashboard

4. **Database Access:**
   - Create separate database users for different services
   - Use read-only users for backup/analytics
   - Enable database audit logging
   - Restrict database access to specific IPs (if possible)

5. **Migrations:**
   - Always test migrations locally first
   - Back up database before major migrations
   - Use `prisma migrate status` to verify pending migrations
   - Review migration files before deploying to production

## Performance Optimization

### Database Connection Reuse

The MoorHall API uses Prisma client singleton pattern:

```typescript
// src/config/db.ts - Globally reused Prisma client
// Each Netlify Function invocation gets the same connection pool
// Reduces connection overhead after cold start
```

### Query Optimization

```typescript
// DO: Select only needed fields
await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, email: true, name: true } // ✅ Efficient
});

// DON'T: Select all fields if not needed
await prisma.user.findUnique({
  where: { id: userId }
  // ❌ Loads all fields, including passwords, tokens, etc.
});

// DO: Use relations efficiently
await prisma.order.findMany({
  include: { customer: true }, // Load related data in one query
  take: 20 // Limit results
});

// DON'T: N+1 queries
const orders = await prisma.order.findMany();
for (const order of orders) {
  const customer = await prisma.customer.findUnique({ where: { id: order.customerId } }); // ❌ Slow!
}
```

### Caching Strategy

1. **HTTP Caching** - Configure in netlify.toml (already done)
2. **Database Caching** - Use Redis if high traffic
3. **API Response Caching** - Implement for frequently-accessed data

## Monitoring & Logging

### Netlify Dashboard

- **Deployments**: Site > Deploys (view build logs)
- **Functions**: Site > Functions > logs (real-time)
- **Analytics**: Site > Analytics (traffic, errors)

### Prisma Logging

Development:
```typescript
// src/config/db.ts - Logs all queries in dev
const logs = ['query', 'error', 'warn'];
```

Production:
```typescript
// src/config/db.ts - Only error logs in production
const logs = ['error'];
```

### External Monitoring

```bash
# Monitor with curl
curl -i https://your-site.netlify.app/health

# Check logs with netlify CLI
npm install -g netlify-cli
netlify login
netlify logs --function=api --tail
```

## Next Steps

1. ✅ Choose database provider (Supabase recommended)
2. ✅ Set up PostgreSQL database with connection pooling
3. ✅ Configure environment variables locally
4. ✅ Test API locally with `npm run dev`
5. ✅ Connect GitHub repository to Netlify
6. ✅ Deploy and verify functions
7. ✅ Monitor with Netlify dashboard and logs
8. ✅ Set up CI/CD with GitHub Actions
9. ✅ Configure domain and SSL/TLS (automatic with Netlify)
10. ✅ Implement API monitoring and error tracking (optional: Sentry, DataDog)

## Resources

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/connect-your-database-typescript-postgres)
- [Prisma Connection Pooling](https://www.prisma.io/docs/guides/database/connection-pooling)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Supabase Prisma Integration](https://supabase.com/docs/guides/getting-started/quickstarts/prisma)
- [Railway PostgreSQL Guide](https://docs.railway.app/databases/postgresql)
- [AWS RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)

## Summary

Your MoorHall API is now configured for production deployment on Netlify with:

- ✅ Prisma ORM for type-safe database access
- ✅ PostgreSQL with connection pooling for serverless
- ✅ Netlify Functions for serverless compute
- ✅ Automatic migrations on deploy
- ✅ Security headers and CORS configured
- ✅ Error handling and logging
- ✅ Performance optimization for cold starts

Follow the Configuration phases above, and you'll be running in production within 30 minutes!
