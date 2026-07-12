/**
 * Activity Service - Handles activity logging and retrieval
 * 
 * Provides methods for creating and querying activity logs
 * for audit trails and admin history pages.
 */

import prisma from '../config/db';
import { ActivityType } from '@prisma/client';

export interface CreateActivityLogParams {
  type: ActivityType;
  entityType: string;
  entityId?: number;
  message: string;
  status?: string;
  metadata?: Record<string, any>;
  adminId?: number;
}

export interface ActivityLogQueryParams {
  type?: ActivityType;
  entityType?: string;
  entityId?: number;
  status?: string;
  adminId?: number;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Create a new activity log entry
 * @param params - Activity log parameters
 */
export async function createActivityLog(params: CreateActivityLogParams): Promise<any> {
  const { type, entityType, entityId, message, status, metadata, adminId } = params;

  return prisma.activityLog.create({
    data: {
      type,
      entityType,
      entityId,
      message,
      status,
      metadata: metadata || undefined,
      adminId,
    },
    include: {
      admin: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Query activity logs with filters and pagination
 * @param params - Query parameters
 */
export async function getActivityLogs(params: ActivityLogQueryParams) {
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
  } = params;

  const where: any = {};

  if (type) {
    where.type = type;
  }

  if (entityType) {
    where.entityType = entityType;
  }

  if (entityId) {
    where.entityId = entityId;
  }

  if (status) {
    where.status = status;
  }

  if (adminId) {
    where.adminId = adminId;
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
    prisma.activityLog.findMany({
      where,
      include: {
        admin: {
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
    prisma.activityLog.count({ where }),
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
 * Get a single activity log by ID
 * @param id - Activity log ID
 */
export async function getActivityLogById(id: number) {
  return prisma.activityLog.findUnique({
    where: { id },
    include: {
      admin: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get activity logs for a specific order
 * @param orderId - Order ID
 */
export async function getActivityLogsByOrder(orderId: number) {
  return prisma.activityLog.findMany({
    where: {
      entityType: 'ORDER',
      entityId: orderId,
    },
    include: {
      admin: {
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
 * Log order status change activity
 * @param orderId - Order ID
 * @param orderNumber - Order number
 * @param previousStatus - Previous status
 * @param newStatus - New status
 * @param adminId - Admin who made the change
 * @param note - Optional note
 */
export async function logOrderStatusChange(
  orderId: number,
  orderNumber: string,
  previousStatus: string | null,
  newStatus: string,
  adminId?: number,
  note?: string
) {
  return createActivityLog({
    type: 'ORDER_STATUS_CHANGED',
    entityType: 'ORDER',
    entityId: orderId,
    message: `Order ${orderNumber} status changed from ${previousStatus || 'N/A'} to ${newStatus}`,
    status: newStatus,
    metadata: {
      previousStatus,
      newStatus,
      note,
    },
    adminId,
  });
}

/**
 * Log order creation activity
 * @param orderId - Order ID
 * @param orderNumber - Order number
 * @param customerName - Customer name
 */
export async function logOrderCreated(
  orderId: number,
  orderNumber: string,
  customerName: string
) {
  return createActivityLog({
    type: 'ORDER_CREATED',
    entityType: 'ORDER',
    entityId: orderId,
    message: `New order ${orderNumber} created by ${customerName}`,
    status: 'CREATED',
  });
}

/**
 * Log order update activity
 * @param orderId - Order ID
 * @param orderNumber - Order number
 * @param changes - Changes made
 * @param adminId - Admin who made changes
 */
export async function logOrderUpdate(
  orderId: number,
  orderNumber: string,
  changes: Record<string, any>,
  adminId?: number
) {
  return createActivityLog({
    type: 'ORDER_UPDATED',
    entityType: 'ORDER',
    entityId: orderId,
    message: `Order ${orderNumber} updated`,
    status: 'UPDATED',
    metadata: changes,
    adminId,
  });
}

/**
 * Log admin action
 * @param action - Action description
 * @param entityType - Entity type
 * @param entityId - Entity ID
 * @param adminId - Admin who performed action
 * @param details - Additional details
 */
export async function logAdminAction(
  action: string,
  entityType: string,
  entityId?: number,
  adminId?: number,
  details?: Record<string, any>
) {
  return createActivityLog({
    type: 'ADMIN_ACTION',
    entityType,
    entityId,
    message: action,
    status: 'COMPLETED',
    metadata: details,
    adminId,
  });
}

export default {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
  getActivityLogsByOrder,
  logOrderStatusChange,
  logOrderCreated,
  logOrderUpdate,
  logAdminAction,
};
