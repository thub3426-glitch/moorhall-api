import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { initializeMiddlewares } from './middlewares/compose';
import mainRoutes from './routes/index';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware';
import { checkHealth } from './utils/healthCheck';
import logger from './utils/logger';
import swaggerSpecs from './config/swagger';

export const createApp = (): express.Application => {
  const app = express();

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

  initializeMiddlewares(app);

  const apiPath = process.env.API_PATH || '/api/v1';
  app.use(apiPath, mainRoutes);

  app.get('/', (_req, res) => {
    res.send('Welcome to the MoorHall API');
  });

  app.get('/ok', async (_req, res) => {
    try {
      const health = await checkHealth();
      const httpStatus =
        health.status === 'healthy'
          ? 200
          : health.status === 'degraded'
            ? 503
            : 500;
      res.status(httpStatus).json(health);
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const app = createApp();

export default app;
