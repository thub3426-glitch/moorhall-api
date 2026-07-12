import { Request, Response } from 'express';
import orderService from '../services/order.service';
import whatsappService from '../services/whatsapp.service';
import activityService from '../services/activity.service';
import apiResponse from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';
import { mapOrderStatusToEvent } from '../utils/message-builder';
import { ActivityType } from '@prisma/client';

export const createGuestOrder = asyncHandler(async (req: Request, res: Response) => {
  const { customerName, customerPhone, customerAltPhone, deliveryAddress, locationNotes, orderType, items, notes } = req.body;

  const order = await orderService.createGuestOrder({
    customerName,
    customerPhone,
    customerAltPhone,
    deliveryAddress,
    locationNotes,
    orderType,
    items,
    notes,
  });

  await activityService.createActivityLog({
    type: 'ORDER_CREATED' as ActivityType,
    entityType: 'Order',
    entityId: order.id,
    message: `Guest order ${order.orderNumber} created`,
    metadata: { orderNumber: order.orderNumber, customerPhone },
  });

  const eventType = mapOrderStatusToEvent(order.status);
  
  // Send WhatsApp notification to customer's phone number
  // Don't fail the request if WhatsApp notification fails
  try {
    const whatsappResult = await whatsappService.sendOrderStatusNotification(order.id, eventType);
    if (!whatsappResult.success) {
      console.warn(`Failed to send WhatsApp notification for order ${order.id}:`, whatsappResult.error);
      await activityService.createActivityLog({
        type: 'WHATSAPP_FAILED' as ActivityType,
        entityType: 'Order',
        entityId: order.id,
        message: `WhatsApp notification failed for order ${order.orderNumber}: ${whatsappResult.error}`,
        metadata: { customerPhone },
      });
    }
  } catch (whatsappError) {
    console.error(`Error sending WhatsApp notification for order ${order.id}:`, whatsappError);
    await activityService.createActivityLog({
      type: 'WHATSAPP_FAILED' as ActivityType,
      entityType: 'Order',
      entityId: order.id,
      message: `WhatsApp notification error for order ${order.orderNumber}`,
      metadata: { customerPhone },
    });
  }

  return res.status(201).json(apiResponse.success(order, 'Order created successfully'));
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, paymentStatus, page, limit } = req.query;
  const result = await orderService.getOrders({
    status: status as string,
    paymentStatus: paymentStatus as string,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 20,
  });
  return res.json(apiResponse.success(result.orders, 'Orders retrieved successfully', result.pagination));
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const order = await orderService.getOrderById(id);
  if (!order) {
    return res.status(404).json(apiResponse.notFound('Order not found'));
  }
  return res.json(apiResponse.success(order, 'Order retrieved successfully'));
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const { status, note, sendNotification = true } = req.body;
  const adminId = (req as any).user?.id;

  const order = await orderService.updateOrderStatus(id, status, adminId, note);

  await activityService.createActivityLog({
    type: 'ORDER_STATUS_CHANGED' as ActivityType,
    entityType: 'Order',
    entityId: order.id,
    message: `Order ${order.orderNumber} status changed to ${status}`,
    adminId,
    metadata: { newStatus: status, sendNotification },
  });

  const eventType = mapOrderStatusToEvent(order.status);

  // Send WhatsApp notification to customer's phone number if sendNotification is true (default)
  if (sendNotification) {
    try {
      const whatsappResult = await whatsappService.sendOrderStatusNotification(order.id, eventType, adminId);
      if (!whatsappResult.success) {
        console.warn(`Failed to send WhatsApp notification for order ${order.id}:`, whatsappResult.error);
        // Log the failure but don't block the response
        await activityService.createActivityLog({
          type: 'WHATSAPP_FAILED' as ActivityType,
          entityType: 'Order',
          entityId: order.id,
          message: `WhatsApp notification failed for order ${order.orderNumber}: ${whatsappResult.error}`,
          adminId,
          metadata: { newStatus: status, error: whatsappResult.error },
        });
      }
    } catch (whatsappError) {
      console.error(`Error sending WhatsApp notification for order ${order.id}:`, whatsappError);
      // Log error but don't fail the request
      await activityService.createActivityLog({
        type: 'WHATSAPP_FAILED' as ActivityType,
        entityType: 'Order',
        entityId: order.id,
        message: `WhatsApp notification error for order ${order.orderNumber}`,
        adminId,
        metadata: { newStatus: status, error: 'Unexpected error' },
      });
    }
  }

  return res.json(apiResponse.success(order, 'Order status updated successfully'));
});

export const reviewPayment = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  const { action, note } = req.body;
  const adminId = (req as any).user?.id;

  if (!adminId) {
    return res.status(401).json(apiResponse.unauthorized('Unauthorized'));
  }

  const order = await orderService.reviewPayment(id, action, adminId, note);

  if (action === 'approve') {
    await activityService.createActivityLog({
      type: 'ORDER_STATUS_CHANGED' as ActivityType,
      entityType: 'Order',
      entityId: order.id,
      message: `Payment approved for order ${order.orderNumber}`,
      adminId,
      metadata: { paymentStatus: order.paymentStatus },
    });

    const eventType = mapOrderStatusToEvent('APPROVED');
    
    // Send WhatsApp notification to customer's phone number
    // Don't fail the request if WhatsApp notification fails
    try {
      const whatsappResult = await whatsappService.sendOrderStatusNotification(order.id, eventType, adminId);
      if (!whatsappResult.success) {
        console.warn(`Failed to send WhatsApp notification for order ${order.id}:`, whatsappResult.error);
        await activityService.createActivityLog({
          type: 'WHATSAPP_FAILED' as ActivityType,
          entityType: 'Order',
          entityId: order.id,
          message: `WhatsApp notification failed for order ${order.orderNumber}: ${whatsappResult.error}`,
          adminId,
          metadata: { paymentStatus: order.paymentStatus, error: whatsappResult.error },
        });
      }
    } catch (whatsappError) {
      console.error(`Error sending WhatsApp notification for order ${order.id}:`, whatsappError);
      await activityService.createActivityLog({
        type: 'WHATSAPP_FAILED' as ActivityType,
        entityType: 'Order',
        entityId: order.id,
        message: `WhatsApp notification error for order ${order.orderNumber}`,
        adminId,
        metadata: { paymentStatus: order.paymentStatus },
      });
    }
  } else {
    await activityService.createActivityLog({
      type: 'WHATSAPP_FAILED' as ActivityType,
      entityType: 'Order',
      entityId: order.id,
      message: `Payment rejected for order ${order.orderNumber}: ${note || 'No reason provided'}`,
      adminId,
      metadata: { rejectionReason: note },
    });

    // Send cancellation notification to customer's phone number
    try {
      const whatsappResult = await whatsappService.sendOrderStatusNotification(order.id, 'ORDER_CANCELLED', adminId);
      if (!whatsappResult.success) {
        console.warn(`Failed to send WhatsApp cancellation notification for order ${order.id}:`, whatsappResult.error);
        await activityService.createActivityLog({
          type: 'WHATSAPP_FAILED' as ActivityType,
          entityType: 'Order',
          entityId: order.id,
          message: `WhatsApp cancellation notification failed for order ${order.orderNumber}: ${whatsappResult.error}`,
          adminId,
          metadata: { error: whatsappResult.error },
        });
      }
    } catch (whatsappError) {
      console.error(`Error sending WhatsApp cancellation notification for order ${order.id}:`, whatsappError);
      await activityService.createActivityLog({
        type: 'WHATSAPP_FAILED' as ActivityType,
        entityType: 'Order',
        entityId: order.id,
        message: `WhatsApp cancellation notification error for order ${order.orderNumber}`,
        adminId,
      });
    }
  }

  return res.json(apiResponse.success(order, `Payment ${action}d successfully`));
});

export const getPaymentSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await orderService.getPaymentSettings();
  return res.json(apiResponse.success(settings, 'Payment settings retrieved successfully'));
});

export const setPaymentSettings = asyncHandler(async (req: Request, res: Response) => {
  const { paymentMode } = req.body;
  const adminId = (req as any).user?.id;

  if (!adminId) {
    return res.status(401).json(apiResponse.unauthorized('Unauthorized'));
  }

  const settings = await orderService.setPaymentMode(paymentMode, adminId);

  await activityService.logAdminAction('UPDATE_PAYMENT_SETTINGS', 'Settings', settings.id, adminId, { paymentMode });

  return res.json(apiResponse.success(settings, 'Payment settings updated successfully'));
});

export default {
  createGuestOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  reviewPayment,
  getPaymentSettings,
  setPaymentSettings,
};
