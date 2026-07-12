# Production Security Configuration Guide

## Overview
This document outlines all security configurations for production deployment on Netlify, including headers, CORS, authentication, rate limiting, and compliance best practices.

---

## Security Headers (Already Configured in netlify.toml)

### Implemented Headers

#### 1. X-Frame-Options
```
X-Frame-Options: SAMEORIGIN
```
- **Purpose**: Prevents clickjacking attacks
- **Value**: Only allow embedding in pages from same origin
- **More restrictive**: Use `DENY` if iframe not needed

#### 2. X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
- **Purpose**: Prevents MIME type sniffing
- **Value**: Always trust Content-Type header

#### 3. X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
- **Purpose**: Enables XSS filter in older browsers
- **Value**: Block page if XSS detected

#### 4. Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
- **Purpose**: Controls what referrer info is sent
- **Value**: Only send origin for cross-origin requests

#### 5. Permissions-Policy
```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```
- **Purpose**: Restrict browser features
- **Value**: Disable access to location, microphone, camera

#### 6. Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- **Purpose**: Force HTTPS connections
- **Max-age**: 1 year (31536000 seconds)
- **includeSubDomains**: Include all subdomains
- **preload**: Register in HSTS preload list

#### 7. Content-Security-Policy
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;
```
- **Purpose**: Prevent XSS and injection attacks
- **Directives**:
  - `default-src 'self'`: Only allow same-origin by default
  - `script-src`: Allow scripts from same origin
  - `style-src`: Allow styles from same origin and inline
  - `img-src`: Allow images from same origin, data URIs, and HTTPS
  - `font-src`: Allow fonts from same origin and data URIs
  - `connect-src`: Allow connections to same origin and HTTPS

---

## CORS Configuration

### Recommended Setup for Production

**In Environment Variables** (Netlify Dashboard):
```
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com
```

**In Code** (`src/server.ts`):
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || 'https://yourdomain.com',
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));
```

### Security Best Practices

✅ **DO**:
- Whitelist specific domains
- Use exact domain names (case-sensitive)
- Include both `yourdomain.com` and `www.yourdomain.com`
- Use HTTPS in production
- Restrict allowed HTTP methods
- Validate requests on backend

❌ **DON'T**:
- Use `*` (allows all origins)
- Use `*.yourdomain.com` (wildcard subdomains)
- Allow unverified domains
- Trust CORS alone (always validate server-side)

---

## Authentication & JWT Security

### JWT Configuration

```javascript
// In src/config/auth.ts or similar
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate token
jwt.sign(payload, JWT_SECRET, {
  expiresIn: JWT_EXPIRES_IN,
  algorithm: 'HS256', // Strongest symmetric algorithm
});

// Verify token
try {
  const decoded = jwt.verify(token, JWT_SECRET);
} catch (err) {
  // Handle invalid/expired token
}
```

### Secret Generation

```bash
# Minimum 32 characters, preferably 64
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Production: Use 64-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex').repeat(2).slice(0, 64))"
```

### Token Best Practices

✅ **DO**:
- Use strong signing algorithm (HS256 or RS256)
- Set reasonable expiration (7-30 days)
- Refresh tokens regularly
- Invalidate tokens on logout
- Store in httpOnly cookies (prevents XSS)
- Validate on every request

❌ **DON'T**:
- Store secrets in code
- Use weak algorithms (MD5, SHA1)
- Set very long expiration (>30 days)
- Store tokens in localStorage
- Send tokens in URLs
- Trust client-side validation alone

---

## Rate Limiting

### Configuration

Already configured in `src/server.ts`:

```javascript
import rateLimit from 'express-rate-limit';

// General rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later.',
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
```

### Adjustments for Production

Based on expected traffic:

```javascript
// High-traffic API
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
});

// Sensitive endpoints (login, password reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  skipSuccessfulRequests: true, // Don't count successful attempts
});
```

---

## Input Validation & Sanitization

### Validation Middleware

```javascript
// src/middlewares/validate.middleware.ts
import { body, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};

// Usage in routes
router.post('/users', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().isLength({ min: 2 }),
  validateRequest
], createUserController);
```

### Security Best Practices

✅ **DO**:
- Validate all inputs
- Sanitize strings (remove special characters)
- Use allowlists for enums
- Limit input length
- Type-check all data
- Validate file uploads

❌ **DON'T**:
- Trust user input
- Use regex that's vulnerable to ReDoS
- Store unsanitized data
- Skip validation for "trusted" requests

---

## Database Security

### Connection Security

```prisma
# In prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# In DATABASE_URL, ensure:
# - SSL mode: ?sslmode=require
# - Example: postgresql://user:pass@host:5432/db?sslmode=require
```

### Prepared Statements

Prisma automatically uses prepared statements, preventing SQL injection:

```javascript
// Safe - Prisma prevents SQL injection
const user = await prisma.user.findUnique({
  where: { email: userInput.email }
});

// NOT RECOMMENDED - String interpolation
// const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### Access Control

```javascript
// src/middlewares/role.middleware.ts
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};

// Usage
router.delete('/admin/users/:id', authorize(['admin']), deleteUser);
```

---

## Sensitive Data Handling

### Logging

✅ **Safe to log**:
```javascript
console.log({
  method: req.method,
  path: req.path,
  statusCode: res.statusCode,
  duration: Date.now() - startTime,
});
```

❌ **NEVER log**:
```javascript
// DON'T do this:
console.log(req.headers); // Contains Authorization
console.log(req.body); // May contain passwords
console.log(process.env); // Contains secrets
console.log(user); // May contain sensitive data
```

### API Response

Always hide sensitive information in responses:

```javascript
// Bad - Exposes password hash
res.json(user); // Contains hashed password

// Good - Only return needed fields
res.json({
  id: user.id,
  email: user.email,
  name: user.name,
  // password is NOT included
});

// Or use select in Prisma
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    name: true,
    // password is not selected
  }
});
```

---

## File Upload Security

### Configuration

```javascript
// src/middlewares/upload.middleware.ts
import multer from 'multer';

const upload = multer({
  // Size limit: 10MB
  limits: { fileSize: 10 * 1024 * 1024 },
  
  // Allowed mime types
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  
  // Store in memory (or temp directory)
  storage: multer.memoryStorage(),
});

export default upload;
```

### Usage

```javascript
router.post('/upload', upload.single('file'), uploadController);
```

### Security Best Practices

✅ **DO**:
- Limit file size (e.g., 10MB)
- Whitelist mime types
- Validate file content (not just extension)
- Scan with antivirus (optional)
- Store outside webroot
- Generate random filenames
- Set proper permissions

❌ **DON'T**:
- Trust file extensions
- Allow executable files
- Store in public directory
- Use original filenames
- Allow unlimited sizes

---

## Error Handling & Information Disclosure

### Implement Proper Error Handlers

```javascript
// src/middlewares/error.middleware.ts
export const errorHandler = (err, req, res, next) => {
  console.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: err.stack, // Only in development
  });

  // Don't expose sensitive error details to client
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

app.use(errorHandler);
```

### Environment-Specific Responses

```javascript
// Development - detailed errors
{
  "error": "Database connection failed",
  "stack": "Error: ECONNREFUSED at connectDB..."
}

// Production - generic errors
{
  "error": "Internal Server Error"
}
```

---

## Secrets Management

### DO NOT store in code:
- ❌ Hardcoded in source files
- ❌ Committed to Git
- ❌ In version control history

### DO store in:
- ✅ Environment variables (Netlify Dashboard)
- ✅ Secrets manager (AWS Secrets Manager, Vault)
- ✅ `.env` file (local only, in `.gitignore`)

### `.gitignore` Configuration

```
.env
.env.local
.env.*.local
.env.production

# Never commit these
.DS_Store
node_modules/
dist/
.netlify/
```

---

## Compliance & Standards

### OWASP Top 10 Coverage

| Risk | Mitigation |
|------|-----------|
| A01:2021 Broken Access Control | JWT auth, role-based access, authorization middleware |
| A02:2021 Cryptographic Failures | HTTPS, encrypted storage, secure secrets |
| A03:2021 Injection | Prepared statements, input validation, sanitization |
| A04:2021 Insecure Design | Security-first architecture, threat modeling |
| A05:2021 Security Misconfiguration | Security headers, proper environment setup |
| A06:2021 Vulnerable Components | `npm audit`, dependency updates |
| A07:2021 Identification Failures | JWT expiration, secure session management |
| A08:2021 Software/Data Integrity | Package verification, secure dependencies |
| A09:2021 Logging/Monitoring | Comprehensive logging, error tracking |
| A10:2021 SSRF | Input validation, URL scheme verification |

### Compliance Checklist

- [ ] HTTPS/SSL enabled (automatic on Netlify)
- [ ] JWT secrets are strong (32+ characters)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Authentication required for sensitive endpoints
- [ ] Authorization checks in place
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies regularly updated (`npm audit`)
- [ ] Logging without sensitive data
- [ ] Security headers configured
- [ ] Database connections encrypted (SSL)
- [ ] API keys not in code
- [ ] Secrets in environment only

---

## Monitoring & Alerts

### Setup Error Tracking

```javascript
// Example using a logging service
import Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENVIRONMENT,
  tracesSampleRate: 0.1, // 10% of transactions
});

app.use(Sentry.Handlers.errorHandler());
```

### Log Important Events

```javascript
// Successful authentication
console.log({
  event: 'AUTH_SUCCESS',
  userId: user.id,
  timestamp: new Date().toISOString(),
});

// Failed authentication attempts
console.log({
  event: 'AUTH_FAILED',
  email: email,
  attempts: failureCount,
  timestamp: new Date().toISOString(),
});

// Sensitive operations
console.log({
  event: 'SENSITIVE_ACTION',
  action: 'USER_DELETED',
  userId: user.id,
  performedBy: req.user.id,
  timestamp: new Date().toISOString(),
});
```

---

## Regular Security Tasks

### Weekly
- [ ] Review logs for suspicious activity
- [ ] Check rate limiting stats

### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Audit vulnerabilities: `npm audit`
- [ ] Review access logs
- [ ] Test backups

### Quarterly
- [ ] Security penetration testing
- [ ] Review security policies
- [ ] Rotate secrets if needed
- [ ] Update security headers

### Annually
- [ ] Full security audit
- [ ] Compliance review
- [ ] Update security documentation
- [ ] Train team on security practices

---

## Incident Response

### If Security Breach Detected

1. **Immediately**:
   - Disable affected accounts
   - Revoke compromised tokens
   - Review logs to determine scope

2. **Within 1 hour**:
   - Rotate JWT secret
   - Change database passwords
   - Update API keys

3. **Within 24 hours**:
   - Notify users if needed
   - Document incident
   - Post-incident review

### Useful Commands

```bash
# Update all dependencies
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Review what changed
git diff package.json
```

---

## Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [Express.js Security Guide](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Prisma Security](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#transactions)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Last Updated**: June 2026
**Status**: Production Ready ✅
**Security Level**: High 🔒
