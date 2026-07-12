import { Request, Response } from 'express';
import categoryService from '../services/category.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  return res.status(201).json(apiResponse.created(category, 'Category created successfully'));
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const categories = await categoryService.getCategories(includeInactive);
  return res.json(apiResponse.success(categories, 'Categories retrieved successfully'));
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const category = await categoryService.getCategoryById(id);
  return res.json(apiResponse.success(category, 'Category retrieved successfully'));
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const category = await categoryService.updateCategory(id, req.body);
  return res.json(apiResponse.success(category, 'Category updated successfully'));
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  await categoryService.deleteCategory(id);
  return res.json(apiResponse.success(null, 'Category deleted successfully'));
});

export default { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory };
