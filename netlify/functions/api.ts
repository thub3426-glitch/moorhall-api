import serverless from 'serverless-http';
import { default as app } from '../../dist/server.js';

/**
 * Netlify Functions Handler for Express App
 * 
 * Uses serverless-http to wrap Express application for Netlify Functions.
 * This provides clean request/response mapping without manual boilerplate.
 * 
 * IMPORTANT: 
 * - The Express app must be exported from server.ts as a default export
 * - DATABASE_URL environment variable must be set in Netlify Dashboard
 * - For PostgreSQL with Prisma, include connection pooling parameters:
 *   DATABASE_URL="postgresql://user:pass@host:port/db?schema=public&sslmode=require&pool_size=2"
 * 
 * Connection pooling note:
 * - PgBouncer or similar is recommended for Netlify Functions
 * - Each function invocation gets a new Node.js process
 * - Prisma client is initialized on first request and reused within the function lifetime
 */

// Create serverless handler from Express app
const handler = serverless(app);

export { handler };
