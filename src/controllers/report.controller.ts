import { Request, Response } from 'express';
import * as reportService from '../services/report.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json(apiResponse.badRequest('startDate and endDate are required'));
  }
  
  const reports = await reportService.getReports({
    startDate: startDate as string,
    endDate: endDate as string,
  });
  
  return res.json(apiResponse.success(reports, 'Reports retrieved successfully'));
});

export const getRevenueStats = asyncHandler(async (req: Request, res: Response) => {
  const { period } = req.query;
  const stats = await reportService.getRevenueStats({
    period: (period as 'daily' | 'weekly' | 'monthly') || 'daily',
  });
  
  return res.json(apiResponse.success(stats, 'Revenue stats retrieved successfully'));
});

export default { getReports, getRevenueStats };