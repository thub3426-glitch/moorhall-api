import redis from '../config/redis';
import logger from '../utils/logger';

/**
 * Cache Service
 * Manages Redis caching for frequently accessed data
 * Implements automatic expiration and cache invalidation patterns
 */

interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 3600 = 1 hour)
  tags?: string[]; // Tags for bulk invalidation
}

const DEFAULT_TTL = 3600; // 1 hour
const CACHE_VERSION = 'v1:'; // Versioning for cache keys

// Cache key generators
export const cacheKeys = {
  homePageMenu: () => `${CACHE_VERSION}home:menu:full`,
  publicMenuItems: (categoryId?: number, productType?: string) => {
    const parts = [CACHE_VERSION, 'menu:public'];
    if (categoryId) parts.push(`cat:${categoryId}`);
    if (productType) parts.push(`type:${productType}`);
    return parts.join(':');
  },
  menuItemById: (id: number) => `${CACHE_VERSION}menu:item:${id}`,
  menuCategories: () => `${CACHE_VERSION}menu:categories:all`,
  menuCategoryWithItems: (categoryId: number) => `${CACHE_VERSION}menu:cat:${categoryId}:items`,
  // Promotions
  promotions: () => `${CACHE_VERSION}promotions:all`,
  promotionById: (id: number) => `${CACHE_VERSION}promotions:${id}`,
  // Featured Services
  featuredServices: () => `${CACHE_VERSION}services:featured`,
  // Hero section caches
  heroConfig: () => `${CACHE_VERSION}hero:config`,
  heroSlides: () => `${CACHE_VERSION}hero:slides`,
  featuredPromotion: () => `${CACHE_VERSION}hero:featured:promo`,
  heroSection: () => `${CACHE_VERSION}hero:section:full`,
};

export const cacheTags = {
  menuItems: 'menu:items',
  menuCategories: 'menu:categories',
  homePageMenu: 'home:menu',
  heroContent: 'hero:content',
  promotions: 'promotions',
  featuredServices: 'featured:services',
};

/**
 * Get value from cache
 */
export async function get<T>(key: string): Promise<T | null> {
  try {
    if (!redis) {
      logger.warn('Redis not available, skipping cache GET');
      return null;
    }

    const value = await redis.get(key);
    if (value) {
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(value) as T;
    }

    logger.debug(`Cache MISS: ${key}`);
    return null;
  } catch (error) {
    logger.error(`Cache GET error for key ${key}:`, error);
    return null; // Graceful fallback
  }
}

/**
 * Set value in cache with TTL
 */
export async function set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
  try {
    if (!redis) {
      logger.warn('Redis not available, skipping cache SET');
      return;
    }

    const ttl = options?.ttl ?? DEFAULT_TTL;
    const serialized = JSON.stringify(value);

    await redis.setex(key, ttl, serialized);
    logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);

    // Store tags for invalidation
    if (options?.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        await redis.sadd(`${tag}:keys`, key);
      }
    }
  } catch (error) {
    logger.error(`Cache SET error for key ${key}:`, error);
    // Non-blocking error: continue without cache
  }
}

/**
 * Delete specific cache key
 */
export async function del(key: string): Promise<void> {
  try {
    if (!redis) return;
    await redis.del(key);
    logger.debug(`Cache DEL: ${key}`);
  } catch (error) {
    logger.error(`Cache DEL error for key ${key}:`, error);
  }
}

/**
 * Invalidate all cache keys with a specific tag
 */
export async function invalidateTag(tag: string): Promise<void> {
  try {
    if (!redis) return;

    const keys = await redis.smembers(`${tag}:keys`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Cache invalidated ${keys.length} keys with tag: ${tag}`);
    }

    // Clear the tag set itself
    await redis.del(`${tag}:keys`);
  } catch (error) {
    logger.error(`Cache invalidation error for tag ${tag}:`, error);
  }
}

/**
 * Clear entire cache (use with caution)
 */
export async function clear(): Promise<void> {
  try {
    if (!redis) return;
    await redis.flushdb();
    logger.warn('Cache fully cleared');
  } catch (error) {
    logger.error('Cache clear error:', error);
  }
}

/**
 * Get cache stats
 */
export async function getStats(): Promise<{ keys: number; memory: string } | null> {
  try {
    if (!redis) return null;

    const info = await redis.info('keyspace');
    const dbMatch = info.match(/db\d+:keys=(\d+)/);
    const keysCount = dbMatch ? parseInt(dbMatch[1]) : 0;

    const memInfo = await redis.info('memory');
    const memMatch = memInfo.match(/used_memory_human:([^\r\n]+)/);
    const memory = memMatch ? memMatch[1] : 'unknown';

    return { keys: keysCount, memory };
  } catch (error) {
    logger.error('Cache stats error:', error);
    return null;
  }
}

export default {
  get,
  set,
  del,
  invalidateTag,
  clear,
  getStats,
  cacheKeys,
  cacheTags,
};
