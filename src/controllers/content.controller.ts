import { Request, Response } from 'express';
import contentService from '../services/content.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const getContentBlocks = asyncHandler(async (_req: Request, res: Response) => {
  const blocks = await contentService.getContentBlocks();
  return res.json(apiResponse.success(blocks, 'Content blocks retrieved successfully'));
});

export const updateContentBlock = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const data = req.body;
  const block = await contentService.updateContentBlock(id, data);
  return res.json(apiResponse.success(block, 'Content block updated successfully'));
});

export const getPromoBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await contentService.getPromoBanners();
  return res.json(apiResponse.success(banners, 'Promo banners retrieved successfully'));
});

export const updatePromoBanner = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const data = req.body;
  const banner = await contentService.updatePromoBanner(id, data);
  return res.json(apiResponse.success(banner, 'Promo banner updated successfully'));
});

export default {
  getContentBlocks,
  updateContentBlock,
  getPromoBanners,
  updatePromoBanner,
};