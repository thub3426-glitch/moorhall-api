/**
 * Notification Service - Handles notification log management
 * 
 * Provides methods for querying and managing notification logs
 * for admin dashboard and history pages.
 */

import prisma from '../config/db';
import { SendStatus, NotificationChannel, NotificationType } from '@prisma/client';

export interface NotificationLogQueryParams {
  type?: NotificationType;
  channel?: NotificationChannel;
  sentStatus?: SendStatus;
  phoneNumber?: string;
  orderId?: number;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Query notification logs with filters and pagination
 * @param params - Query parameters
 */
export async function getNotificationLogs(params: NotificationLogQueryParams) {
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
  } = params;

  const where: any = {};

  if (type) {
    where.type = type;
  }

  if (channel) {
    where.channel = channel;
  }

  if (sentStatus) {
    where.sentStatus = sentStatus;
  }

  if (phoneNumber) {
    where.phoneNumber = {
      contains: phoneNumber,
      mode: 'insensitive',
    };
  }

  if (orderId) {
    where.orderId = orderId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
          },
        },
        sentByAdmin: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.notificationLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single notification log by ID
 * @param id - Notification log ID
 */
export async function getNotificationLogById(id: number) {
  return prisma.notificationLog.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          totalAmount: true,
        },
      },
      payment: {
        select: {
          id: true,
          method: true,
          status: true,
        },
      },
      reservation: {
        select: {
          id: true,
          customerName: true,
          phoneNumber: true,
          reservationDate: true,
        },
      },
      cateringRequest: {
        select: {
          id: true,
          customerName: true,
          phoneNumber: true,
          eventType: true,
        },
      },
      sentByAdmin: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      webhookEvents: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
}

/**
 * Get notification logs for a specific order
 * @param orderId - Order ID
 */
export async function getNotificationLogsByOrder(orderId: number) {
  return prisma.notificationLog.findMany({
    where: {
      orderId,
    },
    include: {
      sentByAdmin: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get notification statistics
 */
export async function getNotificationStats() {
  const [
    totalNotifications,
    sentNotifications,
    failedNotifications,
    pendingNotifications,
    deliveredNotifications,
    readNotifications,
  ] = await Promise.all([
    prisma.notificationLog.count(),
    prisma.notificationLog.count({ where: { sentStatus: 'SENT' } }),
    prisma.notificationLog.count({ where: { sentStatus: 'FAILED' } }),
    prisma.notificationLog.count({ where: { sentStatus: 'PENDING' } }),
    prisma.notificationLog.count({ where: { sentStatus: 'DELIVERED' } }),
    prisma.notificationLog.count({ where: { sentStatus: 'READ' } }),
  ]);

  return {
    total: totalNotifications,
    sent: sentNotifications,
    failed: failedNotifications,
    pending: pendingNotifications,
    delivered: deliveredNotifications,
    read: readNotifications,
  };
}

/**
 * Update notification status from webhook
 * @param providerMessageId - Provider message ID
 * @param status - New status
 */
export async function updateNotificationStatus(
  providerMessageId: string,
  status: SendStatus
) {
  return prisma.notificationLog.updateMany({
    where: {
      providerMessageId,
    },
    data: {
      sentStatus: status,
      ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      ...(status === 'READ' ? { readAt: new Date() } : {}),
    },
  });
}

export default {
  getNotificationLogs,
  getNotificationLogById,
  getNotificationLogsByOrder,
  getNotificationStats,
  updateNotificationStatus,
};
