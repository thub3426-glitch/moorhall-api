import { Request, Response } from 'express';
import heroService from '../services/hero.service';
import cacheService from '../services/cache.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * GET /api/v1/hero
 * Public hero section data (config + slides + featured)
 * No authentication required
 */
export const getHeroSection = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = cacheService.cacheKeys.heroSection();

  // Try cache first
  let heroData = await cacheService.get(cacheKey);

  if (!heroData) {
    // Fetch from service
    heroData = await heroService.getHeroSection();

    // Cache for 1 hour
    await cacheService.set(cacheKey, heroData, {
      ttl: 3600,
      tags: [cacheService.cacheTags.heroContent],
    });
  }

  return res.json(
    apiResponse.success(heroData, 'Hero section retrieved successfully')
  );
});

/**
 * GET /api/v1/hero/slides
 * Just the carousel slides
 */
export const getHeroSlides = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = cacheService.cacheKeys.heroSlides();

  // Try cache first
  let slides = await cacheService.get(cacheKey);

  if (!slides) {
    // Fetch from service
    slides = await heroService.getHeroSlides();

    // Cache for 1 hour
    await cacheService.set(cacheKey, slides, {
      ttl: 3600,
      tags: [cacheService.cacheTags.heroContent],
    });
  }

  return res.json(
    apiResponse.success(slides, 'Hero slides retrieved successfully', {
      slideCount: Array.isArray(slides) ? slides.length : 0,
    })
  );
});

/**
 * GET /api/v1/hero/config
 * Hero configuration (title, subtitle, etc)
 */
export const getHeroConfig = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = cacheService.cacheKeys.heroConfig();

  // Try cache first
  let config = await cacheService.get(cacheKey);

  if (!config) {
    // Fetch from service
    config = await heroService.getHeroConfig();

    // Cache for 1 hour
    await cacheService.set(cacheKey, config, {
      ttl: 3600,
      tags: [cacheService.cacheTags.heroContent],
    });
  }

  return res.json(
    apiResponse.success(config, 'Hero configuration retrieved successfully')
  );
});

/**
 * GET /api/v1/hero/featured
 * Featured promotion banner
 */
export const getFeaturedPromotion = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = cacheService.cacheKeys.featuredPromotion();

  // Try cache first
  let featured = await cacheService.get(cacheKey);

  if (!featured) {
    // Fetch from service
    featured = await heroService.getFeaturedPromotion();

    if (featured) {
      // Cache for 1 hour
      await cacheService.set(cacheKey, featured, {
        ttl: 3600,
        tags: [cacheService.cacheTags.heroContent],
      });
    }
  }

  return res.json(
    apiResponse.success(featured, 'Featured promotion retrieved successfully')
  );
});

export default {
  getHeroSection,
  getHeroSlides,
  getHeroConfig,
  getFeaturedPromotion,
};
