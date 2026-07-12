import { Request, Response } from 'express';
import adminService from '../services/admin.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();
  return res.json(apiResponse.success(stats, 'Dashboard data retrieved successfully'));
});

export default { getDashboard };
