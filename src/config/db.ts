import { PrismaClient } from '@prisma/client';

// For serverless environments, we need to handle connection pooling carefully
const isNetlify = !!process.env.NETLIFY || process.env.NETLIFY === 'true';
const isVercel = !!process.env.VERCEL || process.env.VERCEL === '1' || process.env.VERCEL === 'true';
const isServerless = isNetlify || isVercel;
const isProduction = process.env.NODE_ENV === 'production';

const createClient = () => {
  const logs = (isServerless || isProduction) ? ['error'] : ['query', 'error', 'warn'];
  return new PrismaClient({ 
    log: logs as any,
    // Connection pooling for serverless environments
    // Netlify Functions are cold-started, so we need efficient connection management
  });
};

let _prisma: PrismaClient | null = null;

function initPrisma(): PrismaClient {
  if (_prisma) return _prisma;

  if (!process.env.DATABASE_URL) {
    throw new Error('Environment variable DATABASE_URL is not set');
  }

  _prisma = createClient();
  return _prisma;
}

// Export a proxy that lazy-initializes the Prisma client on first use.
// This prevents import-time crashes in serverless platforms when DATABASE_URL
// is not configured while still allowing code to access Prisma transparently.
const prismaProxy = new Proxy(
  {},
  {
    get(_target, prop: string | symbol) {
      const client = initPrisma();
      const value = (client as any)[prop];
      if (typeof value === 'function') return value.bind(client);
      return value;
    },
    apply(_target, thisArg, argsList) {
      const client = initPrisma();
      return (client as any).apply(thisArg, argsList);
    },
    construct(_target, argsList) {
      const client = initPrisma();
      return new (client as any)(...argsList);
    },
  }
) as unknown as PrismaClient;

export default prismaProxy;