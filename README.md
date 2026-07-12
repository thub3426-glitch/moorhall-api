# Moor Hall API

Backend API for the Moor Hall restaurant management system, built with Express.js, TypeScript, Prisma, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (admin/customer)
- **Menu Management**: Categories, menu items, pricing
- **Order Management**: Full order lifecycle with status tracking
- **Reservation System**: Table reservations with date/time management
- **Catering Services**: Event and catering order management
- **Payment Processing**: Stripe integration for payments
- **Notifications**: Email (SMTP), SMS (Twilio/Pindo), WhatsApp Cloud API
- **Content Management**: Dynamic content updates (hero, about, etc.)
- **Reporting**: Sales, orders, reservations reports
- **File Uploads**: Cloudinary integration for images
- **API Documentation**: Auto-generated Swagger docs at `/api-docs`

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Google OAuth (optional)
- **File Storage**: Cloudinary
- **Payments**: Stripe
- **Messaging**: Twilio, Pindo, WhatsApp Cloud API
- **Deployment**: Netlify (fully optimized)

## 🚀 Netlify Deployment (Production-Ready)

This project is **fully configured for seamless deployment to Netlify** with zero additional setup required beyond environment variables.

### Quick Start (10 minutes)
👉 **[Quick Start: Deploy to Netlify in 10 Minutes](./docs/QUICK_START_NETLIFY.md)**

### Complete Documentation
- 📖 [Complete Netlify Deployment Guide](./docs/NETLIFY_DEPLOYMENT.md) - End-to-end deployment instructions
- ⚙️ [Environment Setup Guide](./docs/ENVIRONMENT_SETUP.md) - Configure local and production environments
- 🔒 [Production Security Configuration](./docs/PRODUCTION_SECURITY.md) - Security best practices and headers
- ⚡ [Performance Optimization Guide](./docs/PERFORMANCE_OPTIMIZATION.md) - Optimize for speed and reliability
- 📚 [Deployment Documentation Index](./docs/DEPLOYMENT_INDEX.md) - Complete documentation reference

### Pre-Configured for Production
✅ Security headers and CORS configured  
✅ Database connection pooling ready  
✅ Serverless function routing setup  
✅ GitHub Actions CI/CD pipeline included  
✅ SSL/HTTPS automatic  
✅ Global CDN edge caching  
✅ Error tracking and monitoring ready  

**Just add your environment variables and deploy!**

---

## Project Structure

```
moor-hall-api/
├── api/              # API entry point
│   └── index.ts      # Express app handler
├── src/
│   ├── config/      # Configuration (db, swagger)
│   ├── controllers/ # Request handlers
│   ├── docs/        # API documentation (Swagger)
│   ├── gateways/    # External service integrations
│   ├── middlewares/ # Express middlewares
│   ├── routes/      # Route definitions
│   ├── types/       # TypeScript types
│   └── server.ts    # Express app configuration
├── prisma/          # Database schema & migrations (PostgreSQL)
├── netlify/         # Netlify serverless functions
├── docs/            # Deployment & configuration guides
├── .env             # Local environment variables
└── package.json
```

## Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- npm or yarn

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd moor-hall-api
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

   Minimum required for local development:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/moor_db?schema=public"
   JWT_SECRET="your-secret-key"
   JWT_REFRESH_SECRET="your-refresh-secret-key"
   FRONTEND_URL="http://localhost:5173"
   BACKEND_URL="http://localhost:3005"
   ```

3. **Set up the database**:
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run migrations
   npm run db:migrate

   # (Optional) Seed database
   npm run db:seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

   Server will start at http://localhost:3005

   - API: http://localhost:3005/api/v1
   - Health check: http://localhost:3005/health
   - API Docs: http://localhost:3005/api-docs

## Development

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload (nodemon) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server (from `dist/`) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create and apply new migration |
| `npm run db:push` | Push schema changes to database (no migration) |
| `npm run db:prod` | Run migrations in production |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:seed` | Seed database with initial data |

### Environment Variables

See `.env.example` for all available configuration options.

**Key variables**:

- `NODE_ENV` - `development` or `production`
- `PORT` - Server port (default: 3005)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `FRONTEND_URL` - Frontend URL (for CORS and cookies)
- `BACKEND_URL` - Backend URL (for links in emails, etc.)

### Database Workflow

1. **Update schema**: Edit `prisma/schema.prisma`
2. **Generate migration**: `npm run db:migrate` (creates new migration file)
3. **Apply to database**: Migration is automatically applied
4. **Generate client**: `npm run db:generate` (updates Prisma client)

> **Note**: In production, use `npm run db:prod` to apply migrations without creating new ones.

### API Documentation

Swagger documentation is automatically generated from JSDoc comments.

- **Local**: http://localhost:3005/api-docs
- **Production**: `https://your-site.netlify.app/api-docs`

## Production Deployment

### Netlify Deployment

This API is fully configured and optimized for seamless deployment to Netlify with zero additional setup required.

**Quick start**:
```bash
cd moor-hall-api
git push origin main  # Automatic deployment triggered
```

Netlify automatically detects the `netlify.toml` configuration and deploys.

👉 **[See Complete Netlify Deployment Guide](./docs/NETLIFY_DEPLOYMENT.md) for step-by-step instructions**

**Prerequisites**:
- PostgreSQL database (Supabase, Railway, AWS RDS, or self-hosted)
- All required environment variables set in Netlify Dashboard

### Environment Variables for Production

Set these in Netlify Dashboard (Settings → Build & Deploy → Environment):

**Required**:
- `DATABASE_URL` - PostgreSQL connection string (with `?sslmode=require`)
- `JWT_SECRET` - Secure random string (32+ characters)
- `SESSION_SECRET` - Secure random string (32+ characters)
- `CORS_ORIGINS` - Your frontend domain(s)

**Optional** (based on features used):
- Cloudinary, SendGrid, Stripe, WhatsApp, etc.

### Database Migrations on Production

Use Prisma for managing migrations:
```bash
npm run db:prod  # Deploy pending migrations in production
```

See [Netlify Deployment Guide](./docs/NETLIFY_DEPLOYMENT.md) for detailed production database strategies.

## Architecture

### Server Modes

The server supports standalone mode (development and production):
- Starts HTTP server on specified port

### Middlewares

- `helmet` - Security headers
- `cors` - Cross-origin resource sharing
- `morgan` - Request logging
- `cookie-parser` - Cookie parsing
- `express.json/urlencoded` - Body parsing
- `rate-limit` - Rate limiting (configured per route)
- `auth` - JWT verification (protected routes)
- `role` - Role-based access control
- `validate` - Request validation (Zod)
- `error` - Centralized error handling

### Database Connection

PostgreSQL with Prisma ORM provides:

- **Development**: Direct connection with query logging for debugging
- **Production on Netlify**: Optimized for serverless environment
  - Uses global PrismaClient instance for connection reuse
  - Automatic connection pooling
  - SSL encryption (required for cloud databases)
  - Minimal logging in production
  - Connection management via DATABASE_URL parameters

**Best practices**:
- Use connection pooling service (PgBouncer) for high-traffic scenarios
- Database URL format: `postgresql://user:password@host:5432/database?sslmode=require`
- Enable SSL to comply with Netlify security requirements
- Recommended cloud providers: Supabase, Railway, AWS RDS

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register customer
- `POST /api/v1/auth/login` - Login customer
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/check` - Check authentication status
- `POST /api/v1/auth/admin/login` - Admin login (Google OAuth)

### Admin Routes (require admin role)
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `GET /api/v1/admin/orders` - List all orders
- `GET /api/v1/admin/reservations` - List all reservations
- `GET /api/v1/admin/customers` - List all customers
- `GET /api/v1/admin/menu-items` - Manage menu items
- `GET /api/v1/admin/categories` - Manage categories
- `GET /api/v1/admin/content` - Manage content
- `GET /api/v1/admin/settings` - Manage settings
- `GET /api/v1/admin/reports` - Generate reports
- `GET /api/v1/admin/activities` - Activity logs

### Customer Routes
- `GET /api/v1/menu` - Get public menu
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - Get customer orders
- `POST /api/v1/reservations` - Create reservation
- `GET /api/v1/reservations` - Get customer reservations

### Webhooks
- `POST /api/v1/webhooks/stripe` - Stripe payment webhooks
- `POST /api/v1/webhooks/whatsapp` - WhatsApp messages

## Security

- **JWT Authentication**: Access tokens (15min) and refresh tokens (7days)
- **Password Hashing**: bcryptjs
- **Helmet**: Security headers
- **CORS**: Configured for specific origins
- **Rate Limiting**: Per-route limits to prevent abuse
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection**: Prevented by Prisma ORM

## Performance

- **Database**: Connection pooling (PgBouncer recommended for high traffic)
- **Caching**: Consider Redis for sessions and frequently accessed data

## Monitoring

- **Netlify Dashboard**: View function logs, deployment status, and analytics
- **Database**: Use Prisma Studio (`npm run db:studio`) or your database GUI
- **Error Tracking**: Integrate Sentry, LogRocket, or similar services (optional)
- **Performance**: Monitor response times in Netlify Analytics

## Troubleshooting

### Common Issues

1. **Database connection fails**
   - Check DATABASE_URL format: `postgresql://user:pass@host:port/db?sslmode=require`
   - Test locally: `psql $DATABASE_URL -c "SELECT 1"`
   - Verify database is accessible from Netlify
   - Check credentials in Netlify environment variables

2. **Prisma client not found**
   - Run `npm run db:generate`
   - Ensure `@prisma/client` is in dependencies

3. **Build fails on Netlify**
   - Verify all env vars are set in Netlify Dashboard
   - Check build logs: Netlify Dashboard → Deploys → Select failed deploy
   - Run `npm run build` locally to reproduce issues
   - See [Complete Troubleshooting Guide](./docs/NETLIFY_DEPLOYMENT.md#troubleshooting) for more solutions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with clear commit messages
4. Test locally
5. Submit a pull request

## License

ISC

## Support

For questions, contact the development team.
