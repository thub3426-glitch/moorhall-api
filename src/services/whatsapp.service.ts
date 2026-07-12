/**
 * WhatsApp Service - Business logic for WhatsApp notifications
 * 
 * This service handles the orchestration of sending WhatsApp notifications,
 * including logging attempts and results to the database.
 */

import prisma from '../config/db';
import whatsappGateway, { WhatsAppSendResult } from '../gateways/whatsapp.gateway';
import { buildOrderMessage, getMessageSummary, mapOrderStatusToEvent, NotificationEventType } from '../utils/message-builder';
import { isValidPhoneNumber } from '../utils/phone';
import { ActivityType } from '@prisma/client';

export interface SendNotificationOptions {
  phoneNumber: string;
  eventType: NotificationEventType;
  orderId?: number;
  paymentId?: number;
  reservationId?: number;
  cateringRequestId?: number;
  sentByAdminId?: number;
  customMessage?: string;
  context?: {
    customerName?: string;
    orderNumber?: string;
    totalAmount?: string;
    deliveryAddress?: string;
    receiptUrl?: string;
  };
}

export interface NotificationResult {
  success: boolean;
  notificationLogId?: number;
  message: string;
  error?: string;
}

/**
 * Send a WhatsApp notification
 * @param options - Notification options
 */
export async function sendWhatsAppNotification(options: SendNotificationOptions): Promise<NotificationResult> {
  const {
    phoneNumber,
    eventType,
    orderId,
    paymentId,
    reservationId,
    cateringRequestId,
    sentByAdminId,
    customMessage,
    context,
  } = options;

  // Validate phone number
  if (!isValidPhoneNumber(phoneNumber)) {
    return {
      success: false,
      message: 'Invalid phone number',
      error: 'Invalid phone number format',
    };
  }

  // Build the message
  let messageText: string;
  if (customMessage) {
    messageText = customMessage;
  } else {
    messageText = buildOrderMessage(eventType, context || {});
  }

  const messageSummary = getMessageSummary(eventType, context || {});

  // Determine notification type from event type
  const notificationTypeMap: Record<string, string> = {
    ORDER_PLACED: 'ORDER_PLACED',
    ORDER_CONFIRMED: 'ORDER_CONFIRMED',
    ORDER_PREPARING: 'ORDER_PREPARING',
    ORDER_READY: 'ORDER_READY',
    ORDER_OUT_FOR_DELIVERY: 'ORDER_OUT_FOR_DELIVERY',
    ORDER_COMPLETED: 'ORDER_COMPLETED',
    ORDER_CANCELLED: 'ORDER_CANCELLED',
    RECEIPT_SENT: 'RECEIPT_SENT',
  };

  const notificationType = notificationTypeMap[eventType] || 'CUSTOM_MESSAGE';

  try {
    // Log the attempt first
    const notificationLog = await prisma.notificationLog.create({
      data: {
        orderId,
        paymentId,
        reservationId,
        cateringRequestId,
        sentByAdminId,
        phoneNumber,
        channel: 'WHATSAPP',
        type: notificationType as any,
        messageSummary,
        providerName: 'META_WHATSAPP_CLOUD',
        sentStatus: 'PENDING',
      },
    });

    // Log activity for send attempt
    if (orderId) {
      await prisma.activityLog.create({
        data: {
          type: 'WHATSAPP_SEND_ATTEMPT',
          entityType: 'ORDER',
          entityId: orderId,
          message: `WhatsApp notification attempt for order ${context?.orderNumber || orderId}`,
          status: 'PENDING',
          metadata: {
            notificationLogId: notificationLog.id,
            eventType,
          },
          adminId: sentByAdminId,
        },
      });
    }

    // Send via gateway
    const result: WhatsAppSendResult = await whatsappGateway.sendTextMessage(phoneNumber, messageText);

    if (result.success && result.messageId) {
      // Update notification log with success
      await prisma.notificationLog.update({
        where: { id: notificationLog.id },
        data: {
          sentStatus: 'SENT',
          providerMessageId: result.messageId,
          providerReference: result.rawResponse?.messaging_product,
          sentAt: new Date(),
        },
      });

      // Log activity for successful send
      if (orderId) {
        await prisma.activityLog.create({
          data: {
            type: 'WHATSAPP_SENT',
            entityType: 'ORDER',
            entityId: orderId,
            message: `WhatsApp notification sent successfully for order ${context?.orderNumber || orderId}`,
            status: 'SENT',
            metadata: {
              notificationLogId: notificationLog.id,
              providerMessageId: result.messageId,
              eventType,
            },
            adminId: sentByAdminId,
          },
        });
      }

      return {
        success: true,
        notificationLogId: notificationLog.id,
        message: 'WhatsApp notification sent successfully',
      };
    }

    // Handle failure
    const failureReason = result.error || 'Unknown error';
    
    await prisma.notificationLog.update({
      where: { id: notificationLog.id },
      data: {
        sentStatus: 'FAILED',
        failureReason,
      },
    });

    // Log activity for failed send
    if (orderId) {
      await prisma.activityLog.create({
        data: {
          type: 'WHATSAPP_FAILED',
          entityType: 'ORDER',
          entityId: orderId,
          message: `WhatsApp notification failed for order ${context?.orderNumber || orderId}`,
          status: 'FAILED',
          metadata: {
            notificationLogId: notificationLog.id,
            error: failureReason,
            eventType,
          },
          adminId: sentByAdminId,
        },
      });
    }

    return {
      success: false,
      notificationLogId: notificationLog.id,
      message: 'Failed to send WhatsApp notification',
      error: failureReason,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log activity for exception
    if (orderId) {
      await prisma.activityLog.create({
        data: {
          type: 'WHATSAPP_FAILED',
          entityType: 'ORDER',
          entityId: orderId,
          message: `WhatsApp notification error for order ${context?.orderNumber || orderId}`,
          status: 'ERROR',
          metadata: {
            error: errorMessage,
            eventType,
          },
          adminId: sentByAdminId,
        },
      });
    }

    return {
      success: false,
      message: 'Error sending WhatsApp notification',
      error: errorMessage,
    };
  }
}

/**
 * Send notification for order status change
 * @param orderId - Order ID
 * @param newStatus - New order status
 * @param sentByAdminId - Admin who triggered the notification
 */
export async function sendOrderStatusNotification(
  orderId: number,
  newStatus: string,
  sentByAdminId?: number
): Promise<NotificationResult> {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        deliveryAddress: true,
        totalAmount: true,
      },
    });

    if (!order) {
      return {
        success: false,
        message: 'Order not found',
        error: 'Order does not exist',
      };
    }

    if (!order.customerPhone) {
      return {
        success: false,
        message: 'Customer phone not available',
        error: 'No phone number on order',
      };
    }

    const eventType = mapOrderStatusToEvent(newStatus);

    return sendWhatsAppNotification({
      phoneNumber: order.customerPhone,
      eventType,
      orderId: order.id,
      sentByAdminId,
      context: {
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        totalAmount: `RWF ${order.totalAmount}`,
        deliveryAddress: order.deliveryAddress || undefined,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error sending order status notification for order ${orderId}:`, errorMessage);
    
    return {
      success: false,
      message: 'Error sending order status notification',
      error: errorMessage,
    };
  }
}

/**
 * Send receipt notification
 * @param orderId - Order ID
 * @param receiptUrl - Receipt URL
 * @param sentByAdminId - Admin who triggered the notification
 */
export async function sendReceiptNotification(
  orderId: number,
  receiptUrl: string,
  sentByAdminId?: number
): Promise<NotificationResult> {
  // Get order details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerPhone: true,
      totalAmount: true,
    },
  });

  if (!order) {
    return {
      success: false,
      message: 'Order not found',
      error: 'Order does not exist',
    };
  }

  if (!order.customerPhone) {
    return {
      success: false,
      message: 'Customer phone not available',
      error: 'No phone number on order',
    };
  }

  // Create receipt record
  const receipt = await prisma.receipt.create({
    data: {
      orderId: order.id,
      receiptNumber: `RCP-${order.orderNumber}-${Date.now()}`,
      receiptUrl,
    },
  });

  const result = await sendWhatsAppNotification({
    phoneNumber: order.customerPhone,
    eventType: 'RECEIPT_SENT',
    orderId: order.id,
    sentByAdminId,
    context: {
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      receiptUrl,
    },
  });

  // Update receipt with notification log ID
  if (result.notificationLogId) {
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: {
        notificationLogId: result.notificationLogId,
        sentAt: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: 'RECEIPT_SENT',
        entityType: 'ORDER',
        entityId: order.id,
        message: `Receipt for order ${order.orderNumber} sent via WhatsApp`,
        status: 'SENT',
        metadata: {
          receiptId: receipt.id,
          notificationLogId: result.notificationLogId,
        },
        adminId: sentByAdminId,
      },
    });
  }

  return result;
}

/**
 * Resend a failed notification
 * @param notificationLogId - Notification log ID
 */
export async function resendNotification(notificationLogId: number): Promise<NotificationResult> {
  const notificationLog = await prisma.notificationLog.findUnique({
    where: { id: notificationLogId },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          deliveryAddress: true,
          totalAmount: true,
        },
      },
    },
  });

  if (!notificationLog) {
    return {
      success: false,
      message: 'Notification log not found',
      error: 'Notification does not exist',
    };
  }

  if (notificationLog.sentStatus === 'SENT') {
    return {
      success: false,
      message: 'Notification already sent',
      error: 'This notification has already been sent successfully',
    };
  }

  // Try to send again
  const result = await sendWhatsAppNotification({
    phoneNumber: notificationLog.phoneNumber,
    eventType: 'CUSTOM_MESSAGE',
    orderId: notificationLog.orderId ?? undefined,
    sentByAdminId: notificationLog.sentByAdminId ?? undefined,
    customMessage: notificationLog.messageSummary,
    context: notificationLog.order ? {
      customerName: notificationLog.order.customerName,
      orderNumber: notificationLog.order.orderNumber,
      totalAmount: `RWF ${notificationLog.order.totalAmount}`,
      deliveryAddress: notificationLog.order.deliveryAddress || undefined,
    } : undefined,
  });

  return result;
}

export default {
  sendWhatsAppNotification,
  sendOrderStatusNotification,
  sendReceiptNotification,
  resendNotification,
};
