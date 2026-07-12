import prisma from '../config/db';
import { getRedisClient } from '../config/redis';

export interface ServiceHealth {
  status: string;
  latency?: number;
  error?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
  };
}

export const checkHealth = async (): Promise<HealthResponse> => {
  const database = await checkDatabase();
  const redis = await checkRedis();

  const hasErrors = [database, redis].some((service) => service.status === 'unhealthy');
  const hasDisabled = [database, redis].some((service) => service.status === 'disabled');

  const status: HealthResponse['status'] = hasErrors
    ? 'unhealthy'
    : hasDisabled
      ? 'degraded'
      : 'healthy';

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: { database, redis },
  };
};

const checkDatabase = async (): Promise<ServiceHealth> => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy', error: (error as Error).message };
  }
};

const checkRedis = async (): Promise<ServiceHealth> => {
  try {
    const client = getRedisClient();
    if (!client) {
      return { status: 'disabled' };
    }
    const start = Date.now();
    await client.ping();
    return { status: 'healthy', latency: Date.now() - start };
  } catch (error) {
    return { status: 'unhealthy', error: (error as Error).message };
  }
};
