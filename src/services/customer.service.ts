/**
 * Customer Service - Business logic for customer management
 * 
 * Handles retrieving customer information from orders
 */

import prisma from '../config/db';
import { Prisma } from '@prisma/client';

export async function getCustomers(page = 1, limit = 20, search?: string) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.OrderWhereInput = {};
  
  if (search) {
    // Use OR for search across name and phone
    where.OR = [
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get distinct customer data from orders
  const [customers, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        customerName: true,
        customerPhone: true,
        customerAltPhone: true,
        deliveryAddress: true,
        id: true,
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['customerPhone'],
      skip,
      take: limit,
    }),
    prisma.order.findMany({
      where,
      distinct: ['customerPhone'],
      select: { id: true },
    }),
  ]);

  // Get order counts for each customer phone
  const phoneNumbers = customers.map(c => c.customerPhone);
  const orderCounts = await prisma.order.groupBy({
    by: ['customerPhone'],
    where: { customerPhone: { in: phoneNumbers } },
    _count: { id: true },
  });

  const countMap = new Map(orderCounts.map(o => [o.customerPhone, o._count.id]));

  const formattedCustomers = customers.map((c) => ({
    name: c.customerName,
    phone: c.customerPhone,
    altPhone: c.customerAltPhone,
    deliveryAddress: c.deliveryAddress,
    orderCount: countMap.get(c.customerPhone) || 0,
  }));

  return {
    customers: formattedCustomers,
    pagination: {
      page,
      limit,
      total: totalCount.length,
      totalPages: Math.ceil(totalCount.length / limit),
    },
  };
}

export async function getCustomerByPhone(phone: string) {
  const orders = await prisma.order.findMany({
    where: { customerPhone: phone },
    include: {
      items: { include: { menuItem: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!orders.length) {
    return null;
  }

  // Aggregate customer info from orders
  const customer = {
    phone: orders[0].customerPhone,
    name: orders[0].customerName,
    altPhone: orders[0].customerAltPhone,
    deliveryAddress: orders[0].deliveryAddress,
    orders: orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        name: item.itemNameSnapshot || item.menuItem?.name || 'Unknown Item',
        description: item.itemDescriptionSnapshot || '',
        quantity: item.quantity,
        unitPrice: item.unitPriceSnapshot,
        lineTotal: item.lineTotal,
        specialInstructions: item.specialInstructions,
      })),
    })),
  };

  return customer;
}

export async function getCustomerStats() {
  const [
    totalCustomers,
    totalOrders,
    recentOrders,
    orderStatusBreakdown,
  ] = await Promise.all([
    prisma.order.findMany({
      distinct: ['customerPhone'],
      select: { customerPhone: true },
    }),
    prisma.order.count(),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ]);

  return {
    totalCustomers: totalCustomers.length,
    totalOrders,
    recentOrders,
    orderStatusBreakdown: orderStatusBreakdown.map(s => ({
      status: s.status,
      count: s._count.id,
    })),
  };
}

export default {
  getCustomers,
  getCustomerByPhone,
  getCustomerStats,
};
