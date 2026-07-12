/**
 * WhatsApp Message Builder
 * 
 * Generates professional, human-friendly messages for order notifications
 */

export type NotificationEventType =
  | 'ORDER_PLACED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PREPARING'
  | 'ORDER_READY'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELLED'
  | 'RECEIPT_SENT'
  | 'CUSTOM_MESSAGE';

export interface MessageContext {
  customerName?: string;
  orderNumber?: string;
  totalAmount?: string;
  deliveryAddress?: string;
  items?: string[];
  receiptUrl?: string;
  customMessage?: string;
}

/**
 * Build a customer-friendly message for order notifications
 * @param eventType - Type of notification event
 * @param context - Context data for message
 */
export function buildOrderMessage(eventType: NotificationEventType, context: MessageContext): string {
  const { customerName, orderNumber, totalAmount, deliveryAddress, items, receiptUrl, customMessage } = context;

  // Greeting
  const greeting = customerName ? `Hello ${customerName},` : 'Hello,';

  switch (eventType) {
    case 'ORDER_PLACED':
      return `${greeting}\n\nYour order ${orderNumber} has been received and is being reviewed.\n\nWe'll send you an update once it's confirmed. Thank you for choosing Moor Hall!`;

    case 'ORDER_CONFIRMED':
      return `${greeting}\n\nGreat news! Your order ${orderNumber} has been confirmed.\n\n${totalAmount ? `Total: ${totalAmount}` : ''}\n\nWe're now preparing your delicious meal.`;

    case 'ORDER_PREPARING':
      return `${greeting}\n\nYour order ${orderNumber} is now being prepared by our chefs.\n\nYou'll receive another update when it's ready!`;

    case 'ORDER_READY':
      if (deliveryAddress) {
        return `${greeting}\n\nYour order ${orderNumber} is ready and will be delivered to:\n${deliveryAddress}\n\nThank you for your order!`;
      }
      return `${greeting}\n\nYour order ${orderNumber} is ready for pickup!\n\nPlease come to Moor Hall to collect your order. We look forward to serving you!`;

    case 'ORDER_OUT_FOR_DELIVERY':
      return `${greeting}\n\nYour order ${orderNumber} is on its way!\n\n${deliveryAddress ? `Delivery address: ${deliveryAddress}` : ''}\n\nPlease be ready to receive your order.`;

    case 'ORDER_COMPLETED':
      return `${greeting}\n\nThank you for your order ${orderNumber}!\n\nWe hope you enjoyed your meal at Moor Hall. We'd love to serve you again soon!\n\n${receiptUrl ? `View your receipt: ${receiptUrl}` : ''}`;

    case 'ORDER_CANCELLED':
      return `${greeting}\n\nWe regret to inform you that your order ${orderNumber} has been cancelled.\n\nIf you have any questions, please contact us. We apologize for any inconvenience.`;

    case 'RECEIPT_SENT':
      return `${greeting}\n\nYour receipt for order ${orderNumber} is now available.\n\n${receiptUrl ? `View your receipt: ${receiptUrl}` : ''}\n\nThank you for dining with Moor Hall!`;

    case 'CUSTOM_MESSAGE':
    default:
      if (customMessage) {
        return `${greeting}\n\n${customMessage}`;
      }
      return `${greeting}\n\nWe have an update regarding your order ${orderNumber}. Please contact us for more details.`;
  }
}

/**
 * Build a short summary of a message for logging purposes
 * @param eventType - Type of notification event
 * @param context - Context data
 */
export function getMessageSummary(eventType: NotificationEventType, context: MessageContext): string {
  const { orderNumber } = context;

  const summaries: Record<NotificationEventType, string> = {
    ORDER_PLACED: `Order ${orderNumber} placed notification`,
    ORDER_CONFIRMED: `Order ${orderNumber} confirmed notification`,
    ORDER_PREPARING: `Order ${orderNumber} preparing notification`,
    ORDER_READY: `Order ${orderNumber} ready notification`,
    ORDER_OUT_FOR_DELIVERY: `Order ${orderNumber} out for delivery notification`,
    ORDER_COMPLETED: `Order ${orderNumber} completed notification`,
    ORDER_CANCELLED: `Order ${orderNumber} cancelled notification`,
    RECEIPT_SENT: `Receipt for order ${orderNumber} sent`,
    CUSTOM_MESSAGE: `Custom message for order ${orderNumber}`,
  };

  return summaries[eventType] || `Notification for order ${orderNumber}`;
}

/**
 * Map order status to notification event type
 * @param orderStatus - Current order status
 */
export function mapOrderStatusToEvent(orderStatus: string): NotificationEventType {
  const statusMap: Record<string, NotificationEventType> = {
    REQUESTED: 'ORDER_PLACED',
    CONFIRMED: 'ORDER_CONFIRMED',
    PREPARING: 'ORDER_PREPARING',
    READY: 'ORDER_READY',
    OUT_FOR_DELIVERY: 'ORDER_OUT_FOR_DELIVERY',
    COMPLETED: 'ORDER_COMPLETED',
    CANCELLED: 'ORDER_CANCELLED',
  };

  return statusMap[orderStatus] || 'ORDER_PLACED';
}

/**
 * Build a custom message from admin input
 * @param message - Custom message from admin
 * @param context - Context data
 */
export function buildCustomMessage(message: string, context: MessageContext): string {
  const { customerName, orderNumber } = context;
  const greeting = customerName ? `Hello ${customerName},` : 'Hello,';
  
  let finalMessage = message;
  
  // Replace placeholders
  if (orderNumber) {
    finalMessage = finalMessage.replace(/{orderNumber}/g, orderNumber);
  }
  if (customerName) {
    finalMessage = finalMessage.replace(/{customerName}/g, customerName);
  }

  return `${greeting}\n\n${finalMessage}`;
}
