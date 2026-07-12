import { Request, Response } from 'express';
import serviceItemService from '../services/serviceItem.service';
import cacheService from '../services/cache.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const createServiceItem = asyncHandler(async (req: Request, res: Response) => {
  const serviceItem = await serviceItemService.createServiceItem(req.body);
  // Invalidate featured services cache
  await cacheService.invalidateTag(cacheService.cacheTags.featuredServices);
  return res.status(201).json(apiResponse.created(serviceItem, 'Service item created successfully'));
});

export const getServiceItems = asyncHandler(async (req: Request, res: Response) => {
  const serviceItems = await serviceItemService.getServiceItems();
  return res.json(apiResponse.success(serviceItems, 'Service items retrieved successfully'));
});

export const getServiceItemById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const serviceItem = await serviceItemService.getServiceItemById(id);
  return res.json(apiResponse.success(serviceItem, 'Service item retrieved successfully'));
});

export const updateServiceItem = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const serviceItem = await serviceItemService.updateServiceItem(id, req.body);
  // Invalidate featured services cache
  await cacheService.invalidateTag(cacheService.cacheTags.featuredServices);
  return res.json(apiResponse.success(serviceItem, 'Service item updated successfully'));
});

export const deleteServiceItem = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  await serviceItemService.deleteServiceItem(id);
  // Invalidate featured services cache
  await cacheService.invalidateTag(cacheService.cacheTags.featuredServices);
  return res.json(apiResponse.success(null, 'Service item deleted successfully'));
});

export const toggleServiceStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const serviceItem = await serviceItemService.toggleServiceStatus(id);
  // Invalidate featured services cache
  await cacheService.invalidateTag(cacheService.cacheTags.featuredServices);
  return res.json(apiResponse.success(serviceItem, 'Service item status toggled successfully'));
});

// Public endpoint for featured services
/**
 * GET /api/v1/services/public/featured
 * Returns all active featured services
 * Cached for 1 hour
 */
export const getPublicFeaturedServices = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = cacheService.cacheKeys.featuredServices();

  // Try to get from cache first
  let services: any = await cacheService.get(cacheKey);

  if (!services) {
    // Cache miss - fetch from database
    services = await serviceItemService.getServiceItems();
    // Filter active services
    services = services.filter((service: any) => service.isActive);

    // Store in cache with TTL of 1 hour
    await cacheService.set(cacheKey, services, {
      ttl: 3600,
      tags: [cacheService.cacheTags.featuredServices],
    });
  }

  return res.json(apiResponse.success(services, 'Featured services retrieved successfully'));
});

export default {
  createServiceItem,
  getServiceItems,
  getServiceItemById,
  updateServiceItem,
  deleteServiceItem,
  toggleServiceStatus,
  getPublicFeaturedServices,
};
