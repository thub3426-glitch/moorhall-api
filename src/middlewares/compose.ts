import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import { getCorsOptions } from '../config/cors';
import { globalRateLimiter } from './rate-limit.middleware';
import requestIdMiddleware from './request-id.middleware';
import { timeoutMiddleware } from './timeout.middleware';
import logger from '../utils/logger';

export const initializeMiddlewares = (app: Express): void => {
  app.set('trust proxy', 1);
  app.set('x-powered-by', false);

  app.use(helmet());
  app.use(compression());
  app.use(cors(getCorsOptions()));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  app.use(requestIdMiddleware);
  app.use(timeoutMiddleware(30000));
  app.use(globalRateLimiter);

  const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'short';
  app.use(
    morgan(morganFormat, {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );
};
