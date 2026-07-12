import { Request, Response } from 'express';
import promotionService from '../services/promotion.service';
import cacheService from '../services/cache.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

// Admin endpoints
export const getAllPromotions = asyncHandler(async (req: Request, res: Response) => {
  const promotions = await promotionService.getAllPromotions();
  return res.json(apiResponse.success(promotions, 'Promotions retrieved successfully'));
});

export const getPromotionById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const promotion = await promotionService.getPromotionById(id);
  return res.json(apiResponse.success(promotion, 'Promotion retrieved successfully'));
});

export const createPromotion = asyncHandler(async (req: Request, res: Response) => {
  const promotion = await promotionService.createPromotion(req.body);
  // Invalidate promotions cache
  await cacheService.invalidateTag(cacheService.cacheTags.promotions);
  return res.status(201).json(apiResponse.created(promotion, 'Promotion created successfully'));
});

export const updatePromotion = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const promotion = await promotionService.updatePromotion(id, req.body);
  // Invalidate promotions cache
  await cacheService.invalidateTag(cacheService.cacheTags.promotions);
  await cacheService.del(cacheService.cacheKeys.promotionById(id));
  return res.json(apiResponse.success(promotion, 'Promotion updated successfully'));
});

export const deletePromotion = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  await promotionService.deletePromotion(id);
  // Invalidate promotions cache
  await cacheService.invalidateTag(cacheService.cacheTags.promotions);
  await cacheService.del(cacheService.cacheKeys.promotionById(id));
  return res.json(apiResponse.success(null, 'Promotion deleted successfully'));
});

export const togglePromotionStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const promotion = await promotionService.togglePromotionStatus(id);
  // Invalidate promotions cache
  await cacheService.invalidateTag(cacheService.cacheTags.promotions);
  await cacheService.del(cacheService.cacheKeys.promotionById(id));
  return res.json(apiResponse.success(promotion, 'Promotion status toggled successfully'));
});

// Public endpoints
/**
 * GET /api/v1/promotions/public
 * Returns all active promotions
 * Cached for 1 hour
 */
export const getPublicPromotions = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = cacheService.cacheKeys.promotions();

  // Try to get from cache first
  let promotions = await cacheService.get(cacheKey);

  if (!promotions) {
    // Cache miss - fetch from database
    promotions = await promotionService.getActivePromotions();

    // Store in cache with TTL of 1 hour
    await cacheService.set(cacheKey, promotions, {
      ttl: 3600,
      tags: [cacheService.cacheTags.promotions],
    });
  }

  return res.json(
    apiResponse.success(promotions, 'Active promotions retrieved successfully', {
      count: Array.isArray(promotions) ? promotions.length : 0,
    })
  );
});
