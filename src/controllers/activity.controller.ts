import { Request, Response } from 'express';
import activityService from '../services/activity.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const getActivities = asyncHandler(async (req: Request, res: Response) => {
  const {
    type,
    entityType,
    entityId,
    status,
    adminId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const result = await activityService.getActivityLogs({
    type: type as any,
    entityType: entityType as string,
    entityId: entityId ? parseInt(entityId as string) : undefined,
    status: status as string,
    adminId: adminId ? parseInt(adminId as string) : undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  });

  return res.json(apiResponse.success(result.logs, 'Activity logs retrieved successfully', result.pagination));
});

export const getActivityById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const activity = await activityService.getActivityLogById(parseInt(id as string));

  if (!activity) {
    return res.status(404).json(apiResponse.notFound('Activity log not found'));
  }

  return res.json(apiResponse.success(activity, 'Activity log retrieved successfully'));
});

export const getOrderActivities = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const activities = await activityService.getActivityLogsByOrder(parseInt(orderId as string));

  return res.json(apiResponse.success(activities, 'Order activities retrieved successfully'));
});
