import { CorsOptions } from 'cors';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://moorhall.netlify.app',
  'https://moorhall-ui.netlify.app',
  'https://moorhall-api.netlify.app',
  'https://api.moorhallrestaurant.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

const getAllowedOrigins = (): string[] => {
  const configuredOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  return [...new Set([...configuredOrigins, ...DEFAULT_ALLOWED_ORIGINS])];
};

export const getCorsOptions = (): CorsOptions => ({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    if (!origin || allowedOrigins.includes(origin) || /https:\/\/[-a-z0-9]+\.netlify\.app$/i.test(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400,
});
