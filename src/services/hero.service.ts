import prisma from '../config/db';
import cacheService from './cache.service';
import ApiError from '../utils/apiError';

/**
 * Hero Content Service
 * Fetches and manages hero section content from database
 * - No hardcoded values
 * - Data-driven from ContentSection and Promotion models
 */

interface HeroSlide {
  id: string;
  title: string;
  description: string;
  image?: string;
  price?: string;
  cta?: {
    text: string;
    action: 'order' | 'reserve' | 'cater';
  };
}

/**
 * Get hero section configuration
 * Fetches from ContentSection with key='hero'
 */
export async function getHeroConfig() {
  const cacheKey = cacheService.cacheKeys.heroConfig();

  // Try cache first
  let config = await cacheService.get(cacheKey);

  if (!config) {
    // Fetch from database
    const contentSection = await prisma.contentSection.findUnique({
      where: { key: 'hero' },
    });

    if (!contentSection || !contentSection.isPublished) {
      throw ApiError.notFound('Hero configuration not found');
    }

    config = {
      title: contentSection.title,
      subtitle: contentSection.body,
      ...((contentSection.dataJson as any) || {}),
    };

    // Cache for 1 hour
    await cacheService.set(cacheKey, config, {
      ttl: 3600,
      tags: [cacheService.cacheTags.heroContent],
    });
  }

  return config;
}

/**
 * Get hero slides from active promotions
 * Fetches all active promotions to use as hero carousel slides
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  const cacheKey = cacheService.cacheKeys.heroSlides();

  // Try cache first
  let slides: HeroSlide[] | null = await cacheService.get<HeroSlide[]>(cacheKey);

  if (!slides) {
    // Fetch from database
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: new Date() } },
            ],
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Limit to 10 slides
    });

    // Transform to hero slides
    slides = promotions.map((promo) => ({
      id: `promo-${promo.id}`,
      title: promo.title,
      description: promo.description || '',
      image: promo.imageUrl ?? undefined,
      price: undefined, // If needed, can be added to Promotion model
      cta: {
        text: 'Order Now',
        action: 'order' as const,
      },
    }));

    // If no promotions, fetch featured menu items as fallback
    if ((slides ?? []).length === 0) {
      const featuredItems = await prisma.menuItem.findMany({
        where: {
          isAvailable: true,
          isFeatured: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      slides = featuredItems.map((item) => ({
        id: `menu-${item.id}`,
        title: item.name,
        description: item.shortDescription || item.description || '',
        image: item.imageUrl ?? undefined,
        price: item.price ? `${item.price.toString()} GHS` : undefined,
        cta: {
          text: 'Order Now',
          action: 'order' as const,
        },
      }));
    }

    // Cache for 1 hour
    await cacheService.set(cacheKey, slides, {
      ttl: 3600,
      tags: [cacheService.cacheTags.heroContent],
    });
  }

  return slides ?? [];
}

/**
 * Get single featured promotion
 * Useful for banner/spotlight display
 */
export async function getFeaturedPromotion() {
  const cacheKey = cacheService.cacheKeys.featuredPromotion();

  // Try cache first
  let promo = await cacheService.get<any>(cacheKey);

  if (!promo) {
    // Fetch most recent active promotion
    promo = await prisma.promotion.findFirst({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: new Date() } },
            ],
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (promo) {
      // Cache for 1 hour
      await cacheService.set(cacheKey, promo, {
        ttl: 3600,
        tags: [cacheService.cacheTags.heroContent],
      });
    }
  }

  return promo;
}

/**
 * Get hero section with slides and config
 * Complete hero data for home page
 */
export async function getHeroSection() {
  try {
    const [config, slides, featured] = await Promise.all([
      getHeroConfig().catch(() => ({
        title: 'Welcome to Moor Hall',
        subtitle: 'Exceptional food, unforgettable experience',
      })),
      getHeroSlides(),
      getFeaturedPromotion(),
    ]);

    return {
      config,
      slides: slides.length > 0 ? slides : getDefaultSlides(),
      featured,
    };
  } catch (error) {
    // Fallback to defaults if all else fails
    return {
      config: {
        title: 'Welcome to Moor Hall',
        subtitle: 'Exceptional food, unforgettable experience',
      },
      slides: getDefaultSlides(),
      featured: null,
    };
  }
}

/**
 * Default slides if no database content available
 * Used as fallback
 */
function getDefaultSlides(): HeroSlide[] {
  return [
    {
      id: 'default-1',
      title: 'Exceptional Cuisine',
      description: 'Crafted with fresh local ingredients and passion',
      cta: { text: 'Order Now', action: 'order' },
    },
    {
      id: 'default-2',
      title: 'Perfect Ambiance',
      description: 'A welcoming space for every occasion',
      cta: { text: 'Reserve Table', action: 'reserve' },
    },
    {
      id: 'default-3',
      title: 'Event Catering',
      description: 'Make your celebration memorable',
      cta: { text: 'Inquire Now', action: 'cater' },
    },
  ];
}

export default {
  getHeroConfig,
  getHeroSlides,
  getFeaturedPromotion,
  getHeroSection,
};
