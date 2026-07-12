import { Request, Response } from 'express';
import notificationService from '../services/notification.service';
import whatsappService from '../services/whatsapp.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const {
    type,
    channel,
    sentStatus,
    phoneNumber,
    orderId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const result = await notificationService.getNotificationLogs({
    type: type as any,
    channel: channel as any,
    sentStatus: sentStatus as any,
    phoneNumber: phoneNumber as string,
    orderId: orderId ? parseInt(orderId as string) : undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
  });

  return res.json(apiResponse.success(result.logs, 'Notification logs retrieved successfully', result.pagination));
});

export const getNotificationById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const notification = await notificationService.getNotificationLogById(parseInt(id as string));

  if (!notification) {
    return res.status(404).json(apiResponse.notFound('Notification log not found'));
  }

  return res.json(apiResponse.success(notification, 'Notification log retrieved successfully'));
});

export const getNotificationStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await notificationService.getNotificationStats();
  return res.json(apiResponse.success(stats, 'Notification statistics retrieved successfully'));
});

export const resendNotification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await whatsappService.resendNotification(parseInt(id as string));

  if (result.success) {
    return res.json(apiResponse.success({ notificationLogId: result.notificationLogId }, result.message));
  }

  return res.status(400).json(apiResponse.badRequest(result.message, [result.error]));
});

export const getOrderNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const notifications = await notificationService.getNotificationLogsByOrder(parseInt(orderId as string));

  return res.json(apiResponse.success(notifications, 'Order notifications retrieved successfully'));
});
