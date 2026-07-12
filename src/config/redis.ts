import logger from '../utils/logger';

type RedisClient = any;

let redisClient: RedisClient | null = null;

/**
 * Initialize Redis client
 * Only attempts connection if ENABLE_REDIS=true
 * System works fine without Redis - just without caching
 */
async function initializeRedis(): Promise<RedisClient | null> {
  try {
    // Redis is optional - only enable if explicitly requested
    const enableRedis = process.env.ENABLE_REDIS?.toLowerCase() === 'true';
    if (!enableRedis) {
      logger.debug('Redis disabled (set ENABLE_REDIS=true to enable)');
      return null;
    }

    // Dynamically import redis - if package is not installed, we'll catch it
    let redis: any;
    try {
      redis = await import('redis');
    } catch (importError) {
      logger.warn('Redis package not installed, running without caching. Install with: npm install redis');
      return null;
    }

    const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = redis.createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 10) {
            logger.error('Redis: Max reconnection attempts reached');
            return new Error('Max Redis reconnection attempts reached');
          }
          return retries * 100;
        },
      },
      // Commands will timeout after 5 seconds
      commandsQueueMaxLen: 10000,
    });

    redisClient.on('error', (err: Error) => {
      logger.error('Redis Client Error:', err.message);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('Redis is ready');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis is reconnecting...');
    });

    await redisClient.connect();
    logger.info('Redis client initialized');
    return redisClient;
  } catch (error) {
    logger.warn('Redis initialization failed, running without caching:', (error as Error).message);
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): RedisClient | null {
  return redisClient;
}

/**
 * Initialize on module load
 */
if (process.env.NODE_ENV !== 'test') {
  initializeRedis();
}

export default redisClient;
