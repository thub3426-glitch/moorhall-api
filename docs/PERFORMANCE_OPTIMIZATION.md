# Performance Optimization Guide for Netlify

This guide provides strategies for optimizing the MoorHall API performance on Netlify's serverless platform.

---

## Table of Contents
1. [Database Optimization](#database-optimization)
2. [Function Performance](#function-performance)
3. [Caching Strategies](#caching-strategies)
4. [Code Optimization](#code-optimization)
5. [Monitoring Performance](#monitoring-performance)
6. [CDN Configuration](#cdn-configuration)

---

## Database Optimization

### Connection Pooling

Netlify Functions create a new database connection for each invocation. Use Prisma's connection pooling:

```prisma
# prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  # Connection pooling (automatically handles multiple connections)
}
```

**For PgBouncer (external connection pool):**

```env
# Use PgBouncer instead of direct PostgreSQL
DATABASE_URL="postgresql://user:password@pgbouncer-host:6432/database?schema=public"
```

### Query Optimization

```javascript
// Bad - N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { userId: user.id } });
  // This runs N+1 queries (1 for users, N for each user's posts)
}

// Good - Eager loading
const users = await prisma.user.findMany({
  include: {
    posts: true, // Load posts in single query
  },
});

// Good - Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    // Avoid selecting large text fields if not needed
  },
});
```

### Indexing Strategy

```prisma
# Add indexes for frequently queried fields
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique // Automatically indexed
  name  String
  role  String  @index   // Index for role-based queries
  createdAt DateTime @default(now()) @index
}

model Post {
  id        Int     @id @default(autoincrement())
  userId    Int     @index // Index foreign key
  title     String
  createdAt DateTime @default(now()) @index
}
```

### Query Caching

```javascript
// In-memory cache (using Map or Redis)
const userCache = new Map();

async function getUser(id) {
  // Check cache first
  if (userCache.has(id)) {
    return userCache.get(id);
  }
  
  // Query database
  const user = await prisma.user.findUnique({ where: { id } });
  
  // Cache for 5 minutes
  userCache.set(id, user);
  setTimeout(() => userCache.delete(id), 5 * 60 * 1000);
  
  return user;
}
```

---

## Function Performance

### Cold Start Optimization

Cold starts happen when a function hasn't been invoked recently. Optimize by:

1. **Reduce bundle size**
   ```bash
   # Analyze bundle size
   npm install -g webpack-cli
   # Check what's in dist/
   ls -lh dist/
   ```

2. **Use ESM (already configured)**
   ```json
   // package.json
   {
     "type": "module"
   }
   ```

3. **Lazy load dependencies**
   ```javascript
   // Load only when needed
   let Sentry;
   
   function getSentry() {
     if (!Sentry) {
       Sentry = require('@sentry/node');
     }
     return Sentry;
   }
   ```

### Function Timeout Optimization

```toml
# netlify.toml
[functions]
  # Increase if needed (depends on plan)
  timeout = 30  # seconds
  
  # Memory allocation (if available on your plan)
  # memory = 1024  # MB
```

**Reduce execution time by:**
- Optimizing database queries
- Caching frequent requests
- Using async/await efficiently
- Avoiding synchronous operations

### Memory Optimization

```javascript
// Good - Stream large files
app.get('/api/export', (req, res) => {
  const stream = fs.createReadStream('large-file.json');
  stream.pipe(res);
});

// Bad - Load entire file into memory
app.get('/api/export', (req, res) => {
  const data = fs.readFileSync('large-file.json'); // Uses lots of memory!
  res.send(data);
});
```

---

## Caching Strategies

### HTTP Caching Headers (configured in netlify.toml)

```toml
# Static assets - long cache
[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# API responses - no cache
[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "max-age=0, must-revalidate"
```

### ETag Headers for API

```javascript
import { createHash } from 'crypto';

function generateETag(data) {
  return createHash('md5').update(JSON.stringify(data)).digest('hex');
}

app.get('/api/users/:id', (req, res) => {
  const user = { id: 1, name: 'John' };
  const etag = generateETag(user);
  
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // Not Modified
  }
  
  res.set('ETag', etag);
  res.json(user);
});
```

### Response Compression

Already configured in `src/server.ts`:

```javascript
import compression from 'compression';
app.use(compression()); // Compresses responses with gzip
```

---

## Code Optimization

### Optimize Imports

Remove unused dependencies:

```javascript
// Bad - Imports entire library if only using one function
import * as lodash from 'lodash';
const unique = lodash.uniq(array);

// Good - Import specific functions
import { uniq } from 'lodash-es';
const unique = uniq(array);

// Best - Use native JavaScript
const unique = [...new Set(array)];
```

### Tree Shaking

Enable tree shaking in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "ES2022",
    "moduleResolution": "node"
  }
}
```

### Async Optimization

```javascript
// Bad - Sequential (slow)
const user = await getUser(id);
const posts = await getPosts(user.id);
const comments = await getComments(posts[0].id);
// Total time: sum of all times

// Good - Parallel (faster)
const [user, posts] = await Promise.all([
  getUser(id),
  getPosts(userId),
]);
// Total time: max of times
```

### Middleware Optimization

Order middleware by frequency:

```javascript
// 1. Most frequent first
app.use(express.json());
app.use(cors());

// 2. Routes that match most requests
app.use('/api/', apiRoutes);

// 3. Less frequent middleware
app.use(helmet());
app.use(morgan('dev'));

// 4. Least frequent (error handling)
app.use(errorHandler);
```

---

## Monitoring Performance

### Add Performance Metrics

```javascript
import { performance } from 'perf_hooks';

app.use((req, res, next) => {
  const start = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration.toFixed(2),
      // Alert if slow
      ...(duration > 1000 && { SLOW_REQUEST: true }),
    }));
  });
  
  next();
});
```

### Use Netlify Analytics

In Netlify Dashboard: **Analytics** tab

View:
- Request count
- Function execution time
- Error rates
- Peak traffic times

### Monitor in Production

```javascript
// Example with Datadog or similar service
import StatsD from 'node-dogstatsd';

const dogstatsd = new StatsD.StatsD();

app.get('/api/users/:id', async (req, res) => {
  const start = Date.now();
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    const duration = Date.now() - start;
    dogstatsd.histogram('api.get_user.duration', duration);
    dogstatsd.increment('api.get_user.success');
    
    res.json(user);
  } catch (error) {
    dogstatsd.increment('api.get_user.error');
    throw error;
  }
});
```

---

## CDN Configuration

### Netlify's Global CDN

Already optimized:
- ✅ Automatic edge caching
- ✅ Global distribution (200+ edge locations)
- ✅ Smart routing
- ✅ Automatic failover

### Cache Optimization

```toml
# netlify.toml

# Cache frequently accessed endpoints
[[redirects]]
  from = "/api/categories"
  to = "/.netlify/functions/api/categories"
  status = 200
  # Add cache directive in headers
  headers = {
    "Cache-Control" = "public, max-age=3600, s-maxage=3600"
  }

# Don't cache user-specific data
[[redirects]]
  from = "/api/me"
  to = "/.netlify/functions/api/me"
  status = 200
  headers = {
    "Cache-Control" = "private, no-cache"
  }
```

### Regional Performance

Netlify automatically:
- Routes requests to nearest edge location
- Caches static content globally
- Optimizes for latency
- Provides redundancy

---

## Performance Checklist

- [ ] Database queries optimized (indexes, eager loading)
- [ ] Connection pooling configured
- [ ] Compression enabled (gzip)
- [ ] Cache headers configured
- [ ] Unused dependencies removed
- [ ] Tree shaking enabled
- [ ] Async operations parallelized
- [ ] Middleware ordered by frequency
- [ ] Performance monitoring in place
- [ ] Cold start optimizations applied
- [ ] Bundle size analyzed and optimized
- [ ] API responses paginated (for large datasets)

---

## Benchmarks

### Target Response Times

| Endpoint | Target | Acceptable |
|----------|--------|-----------|
| Health check | < 50ms | < 100ms |
| Public API | < 200ms | < 500ms |
| Auth endpoints | < 300ms | < 1000ms |
| File uploads | < 2s | < 5s |

### Test Locally

```bash
# Measure response time
time curl -s http://localhost:3005/health

# Load testing (install autocannon)
npm install -g autocannon
autocannon http://localhost:3005/health -c 10 -d 30
```

---

## Resources

- [Netlify Performance](https://docs.netlify.com/platform/large-media/about-large-media/)
- [Prisma Optimization](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance)
- [Node.js Performance](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Express.js Performance](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Last Updated**: June 2026
**Status**: Production Ready ✅
