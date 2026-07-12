import { Request, Response } from 'express';
import menuItemService from '../services/menuItem.service';
import { processMenuPdf as processMenuPdfService } from '../services/pdfMenu.service';
import cacheService from '../services/cache.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';
import { UploadRequest } from '../middlewares/upload.middleware';

export const createMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const menuItem = await menuItemService.createMenuItem(req.body);
  // Invalidate menu caches on creation
  await cacheService.invalidateTag(cacheService.cacheTags.menuItems);
  await cacheService.invalidateTag(cacheService.cacheTags.homePageMenu);
  return res.status(201).json(apiResponse.created(menuItem, 'Menu item created successfully'));
});

export const getMenuItems = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
  const includeUnavailable = req.query.includeUnavailable === 'true';
  const menuItems = await menuItemService.getMenuItems(categoryId, includeUnavailable);
  return res.json(apiResponse.success(menuItems, 'Menu items retrieved successfully'));
});

export const getMenuItemById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const menuItem = await menuItemService.getMenuItemById(id);
  return res.json(apiResponse.success(menuItem, 'Menu item retrieved successfully'));
});

export const updateMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const menuItem = await menuItemService.updateMenuItem(id, req.body);
  // Invalidate menu caches on update
  await cacheService.invalidateTag(cacheService.cacheTags.menuItems);
  await cacheService.invalidateTag(cacheService.cacheTags.homePageMenu);
  await cacheService.del(cacheService.cacheKeys.menuItemById(id));
  return res.json(apiResponse.success(menuItem, 'Menu item updated successfully'));
});

export const toggleAvailability = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const menuItem = await menuItemService.toggleAvailability(id);
  // Invalidate menu caches when availability changes
  await cacheService.invalidateTag(cacheService.cacheTags.menuItems);
  await cacheService.invalidateTag(cacheService.cacheTags.homePageMenu);
  await cacheService.del(cacheService.cacheKeys.menuItemById(id));
  return res.json(apiResponse.success(menuItem, 'Menu item availability toggled successfully'));
});

export const deleteMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  await menuItemService.deleteMenuItem(id);
  // Invalidate menu caches on deletion
  await cacheService.invalidateTag(cacheService.cacheTags.menuItems);
  await cacheService.invalidateTag(cacheService.cacheTags.homePageMenu);
  await cacheService.del(cacheService.cacheKeys.menuItemById(id));
  return res.json(apiResponse.success(null, 'Menu item deleted successfully'));
});

export const processMenuPdf = asyncHandler(async (req: UploadRequest, res: Response) => {
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;

  if (!req.file) {
    return res.status(400).json(apiResponse.badRequest('No PDF file provided'));
  }

  const result = await processMenuPdfService(req.file.buffer);
  const createdItems = await menuItemService.createMenuItemFromPdfExtraction(
    result.items,
    result.images,
    categoryId
  );

  await cacheService.invalidateTag(cacheService.cacheTags.menuItems);
  await cacheService.invalidateTag(cacheService.cacheTags.homePageMenu);

  return res.status(201).json(
    apiResponse.created(
      {
        items: createdItems,
        imagesExtracted: result.rawImageCount,
        imagesUploaded: result.images.length,
      },
      'Menu items created from PDF successfully'
    )
  );
});

// ─── Public endpoints (no auth required) ───────────────────────────────────────

export const getPublicMenuItems = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
  const productType = req.query.productType as string | undefined;
  const cacheKey = cacheService.cacheKeys.publicMenuItems(categoryId, productType);

  // Try to get from cache first
  let menuItems = await cacheService.get(cacheKey);

  if (!menuItems) {
    // Cache miss - fetch from database
    menuItems = await menuItemService.getPublicMenuItems(categoryId, productType);

    // Store in cache with TTL of 1 hour
    await cacheService.set(cacheKey, menuItems, {
      ttl: 3600,
      tags: [cacheService.cacheTags.menuItems],
    });
  }

  return res.json(apiResponse.success(menuItems, 'Menu items retrieved successfully'));
});

export const getPublicMenuItemById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const cacheKey = cacheService.cacheKeys.menuItemById(id);

  // Try to get from cache first
  let menuItem = await cacheService.get(cacheKey);

  if (!menuItem) {
    // Cache miss - fetch from database
    menuItem = await menuItemService.getPublicMenuItemById(id);

    // Store in cache with TTL of 1 hour
    await cacheService.set(cacheKey, menuItem, {
      ttl: 3600,
      tags: [cacheService.cacheTags.menuItems],
    });
  }

  return res.json(apiResponse.success(menuItem, 'Menu item retrieved successfully'));
});

// ─── Home Page Menu (hierarchical with categories) ────────────────────────────

/**
 * GET /api/v1/menu-items/public/home
 * Returns complete menu organized by active categories
 * Used by home page to display menu with category hierarchy
 * Cached for 1 hour
 */
export const getHomePageMenu = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = cacheService.cacheKeys.homePageMenu();

  // Try to get from cache first
  let menu = await cacheService.get(cacheKey);

  if (!menu) {
    // Cache miss - fetch from database
    menu = await menuItemService.getHomePageMenu();

    // Store in cache with TTL of 1 hour
    await cacheService.set(cacheKey, menu, {
      ttl: 3600,
      tags: [cacheService.cacheTags.homePageMenu, cacheService.cacheTags.menuItems],
    });
  }

  const categoriesCount = Array.isArray(menu) ? menu.length : 0;
  const itemsCount = Array.isArray(menu)
    ? menu.reduce((sum: number, cat: any) => sum + (Array.isArray(cat?.items) ? cat.items.length : 0), 0)
    : 0;

  return res.json(
    apiResponse.success(menu, 'Home page menu retrieved successfully', {
      categories: categoriesCount,
      items: itemsCount,
    })
  );
});

/**
 * GET /api/v1/menu-items/public/categories/:id
 * Returns items for a specific category with full details
 * Cached for 1 hour
 */
export const getPublicCategoryWithItems = asyncHandler(async (req: Request, res: Response) => {
  const categoryId = parseInt(req.params.id as string);
  const cacheKey = cacheService.cacheKeys.menuCategoryWithItems(categoryId);

  // Try to get from cache first
  let category = await cacheService.get(cacheKey);

  if (!category) {
    // Cache miss - fetch from database
    category = await menuItemService.getCategoryWithItems(categoryId);

    // Store in cache with TTL of 1 hour
    await cacheService.set(cacheKey, category, {
      ttl: 3600,
      tags: [cacheService.cacheTags.homePageMenu, cacheService.cacheTags.menuItems],
    });
  }

  return res.json(apiResponse.success(category, 'Category items retrieved successfully'));
});

/**
 * GET /api/v1/menu-items/public/categories
 * Returns all active categories for navigation
 * Cached for 1 hour
 */
export const getPublicCategories = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = cacheService.cacheKeys.menuCategories();

  // Try to get from cache first
  let categories = await cacheService.get(cacheKey);

  if (!categories) {
    // Cache miss - fetch from database
    categories = await menuItemService.getActiveCategories();

    // Store in cache with TTL of 1 hour
    await cacheService.set(cacheKey, categories, {
      ttl: 3600,
      tags: [cacheService.cacheTags.menuCategories],
    });
  }

  return res.json(apiResponse.success(categories, 'Categories retrieved successfully'));
});

export default {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
  getPublicMenuItems,
  getPublicMenuItemById,
  getHomePageMenu,
  getPublicCategoryWithItems,
  getPublicCategories,
  processMenuPdf,
};
