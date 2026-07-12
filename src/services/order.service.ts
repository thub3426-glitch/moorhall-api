import prisma from '../config/db';
import { Prisma } from '@prisma/client';
import { generateOrderNumber } from '../utils/orderNumber';

export interface CreateGuestOrderInput {
  customerName: string;
  customerPhone: string;
  customerAltPhone?: string;
  deliveryAddress?: string;
  locationNotes?: string;
  orderType: 'PICKUP' | 'DELIVERY';
  items: Array<{
    menuItemId?: number | string;
    itemName?: string;
    itemDescription?: string;
    unitPrice?: number;
    quantity: number;
    specialInstructions?: string;
  }>;
  notes?: string;
}

export async function createGuestOrder(input: CreateGuestOrderInput) {
  const orderNumber = await generateOrderNumber();

  // Collect all menuItemIds that need to be looked up
  // Convert string IDs to numbers for Prisma query
  const rawIds = input.items
    .map(item => item.menuItemId)
    .filter((id): id is number | string => id !== undefined);
  
  // Convert all IDs to numbers
  const menuItemIds: number[] = rawIds
    .map(id => {
      if (typeof id === 'string') {
        const parsed = parseInt(id, 10);
        return isNaN(parsed) ? null : parsed;
      }
      return id;
    })
    .filter((id): id is number => id !== null);

  // Build a map of menu items for quick lookup
  const menuItemsMap = new Map<number, { name: string; price: number }>();
  if (menuItemIds.length > 0) {
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, price: true },
    });
    menuItems.forEach(mi => {
      menuItemsMap.set(mi.id, { name: mi.name, price: Number(mi.price) });
    });
  }

  // Process items and compute totals using decimal arithmetic
  let subtotal = 0;
  const orderItems = input.items.map(item => {
    let unitPrice: number;
    let itemName: string;

    if (item.menuItemId) {
      // Convert string menuItemId to number for map lookup
      const menuItemIdNum = typeof item.menuItemId === 'string'
        ? parseInt(item.menuItemId, 10)
        : item.menuItemId;
      const menuData = menuItemsMap.get(menuItemIdNum);
      if (!menuData) {
        throw new Error(`Menu item with id ${item.menuItemId} not found`);
      }
      unitPrice = menuData.price;
      itemName = menuData.name;
    } else {
      if (item.unitPrice === undefined) {
        throw new Error('unitPrice is required when menuItemId is not provided');
      }
      if (!item.itemName) {
        throw new Error('itemName is required when menuItemId is not provided');
      }
      unitPrice = item.unitPrice;
      itemName = item.itemName;
    }

    // Calculate line total with proper rounding to 2 decimal places
    const lineTotal = parseFloat((unitPrice * item.quantity).toFixed(2));
    subtotal += lineTotal;

    return {
      menuItemId: typeof item.menuItemId === 'string' ? parseInt(item.menuItemId, 10) : item.menuItemId,
      itemNameSnapshot: itemName,
      itemDescriptionSnapshot: item.itemDescription || '',
      unitPriceSnapshot: parseFloat(unitPrice.toFixed(2)),
      quantity: item.quantity,
      lineTotal,
      specialInstructions: item.specialInstructions,
    };
  });

  // Round subtotal to 2 decimal places
  subtotal = parseFloat(subtotal.toFixed(2));
  const totalAmount = subtotal;

  // Convert orderType to uppercase for Prisma enum
  const orderTypeUpper = input.orderType.toUpperCase() as 'DELIVERY' | 'PICKUP';

  const paymentMode = await getPaymentMode();
  const requiredPaymentAmount = paymentMode === 'HALF_PAYMENT_BEFORE_APPROVAL'
    ? parseFloat((subtotal / 2).toFixed(2))
    : subtotal;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerAltPhone: input.customerAltPhone,
      deliveryAddress: input.deliveryAddress,
      locationNotes: input.locationNotes,
      orderType: orderTypeUpper,
      sourceChannel: 'WEBSITE',
      subtotal,
      totalAmount,
      paymentArrangement: paymentMode === 'HALF_PAYMENT_BEFORE_APPROVAL'
        ? 'PARTIAL_BEFORE_DELIVERY'
        : 'FULL_BEFORE_DELIVERY',
      paymentMode: paymentMode as any,
      requiredPaymentAmount,
      paidAmount: 0,
      remainingAmount: requiredPaymentAmount,
      status: 'PENDING',
      paymentStatus: 'WAITING_PAYMENT',
      items: {
        create: orderItems,
      },
    },
    include: {
      items: true,
    },
  });

  return order;
}

export async function getOrders(filters: {
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}) {
  const { status, paymentStatus, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status as any;
  if (paymentStatus) where.paymentStatus = paymentStatus as any;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: { include: { menuItem: true } },
        reviewedBy: { select: { id: true, fullName: true } },
        confirmedBy: { select: { id: true, fullName: true } },
        approvedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getOrderById(id: number) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { menuItem: true } },
      payments: true,
      history: { orderBy: { createdAt: 'desc' } },
      reviewedBy: { select: { id: true, fullName: true } },
      confirmedBy: { select: { id: true, fullName: true } },
      approvedBy: { select: { id: true, fullName: true } },
    },
  });
}

export async function updateOrderStatus(
  id: number,
  newStatus: string,
  adminId?: number,
  note?: string
) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new Error('Order not found');

  const previousStatus = order.status;

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: newStatus as any,
      ...(adminId && { confirmedByAdminId: adminId, confirmedAt: new Date() }),
    },
    include: { items: { include: { menuItem: true } } },
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId: id,
      previousStatus: previousStatus as any,
      newStatus: newStatus as any,
      changedByAdminId: adminId,
      note,
    },
  });

  return updated;
}

export async function reviewPayment(
  orderId: number,
  action: 'approve' | 'reject',
  adminId: number,
  note?: string
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');

  if (action === 'approve') {
    const newPaymentStatus = order.paymentMode === 'HALF_PAYMENT_BEFORE_APPROVAL'
      ? 'PARTIALLY_PAID'
      : 'PAID';

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: newPaymentStatus as any,
        status: 'APPROVED',
        reviewedByAdminId: adminId,
        approvedByAdminId: adminId,
        approvedAt: new Date(),
        customerPaymentProofNote: note,
      },
      include: { items: { include: { menuItem: true } } },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.status as any,
        newStatus: 'APPROVED',
        changedByAdminId: adminId,
        note: note || 'Payment approved',
      },
    });

    return updated;
  } else {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'REJECTED',
        reviewedByAdminId: adminId,
        customerPaymentProofNote: note,
      },
      include: { items: { include: { menuItem: true } } },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.status as any,
        newStatus: order.status as any,
        changedByAdminId: adminId,
        note: note || 'Payment rejected - please provide valid proof',
      },
    });

    return updated;
  }
}

async function getPaymentMode(): Promise<'FULL_PAYMENT_BEFORE_APPROVAL' | 'HALF_PAYMENT_BEFORE_APPROVAL' | 'PAY_ON_DELIVERY'> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: 'payment_mode' },
  });
  const validModes = ['FULL_PAYMENT_BEFORE_APPROVAL', 'HALF_PAYMENT_BEFORE_APPROVAL', 'PAY_ON_DELIVERY'] as const;
  const mode = setting?.value as string;
  return validModes.includes(mode as any) ? (mode as any) : 'FULL_PAYMENT_BEFORE_APPROVAL';
}

export async function setPaymentMode(
  mode: 'FULL_PAYMENT_BEFORE_APPROVAL' | 'HALF_PAYMENT_BEFORE_APPROVAL' | 'PAY_ON_DELIVERY',
  adminId: number
) {
  return prisma.siteSetting.upsert({
    where: { key: 'payment_mode' },
    update: { value: mode, updatedByAdminId: adminId },
    create: { key: 'payment_mode', value: mode, updatedByAdminId: adminId },
  });
}

export async function getPaymentSettings() {
  const paymentMode = await getPaymentMode();
  const depositPercentage = paymentMode === 'HALF_PAYMENT_BEFORE_APPROVAL' ? 50 : 0;

  return {
    paymentMode,
    depositPercentage,
    description: getPaymentModeDescription(paymentMode),
  };
}

function getPaymentModeDescription(mode: string): string {
  switch (mode) {
    case 'FULL_PAYMENT_BEFORE_APPROVAL':
      return 'Full payment required before order approval';
    case 'HALF_PAYMENT_BEFORE_APPROVAL':
      return '50% deposit required before order approval';
    case 'PAY_ON_DELIVERY':
      return 'Payment on delivery';
    default:
      return 'Full payment required before order approval';
  }
}

export default {
  createGuestOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  reviewPayment,
  setPaymentMode,
  getPaymentSettings,
};
