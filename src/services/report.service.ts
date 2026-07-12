import prisma from '../config/db';

export async function getReports(params: { startDate: string; endDate: string }) {
  const { startDate, endDate } = params;

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: { items: true },
  });

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const totalOrders = orders.length;

  const ordersByStatus: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    PREPARING: 0,
    READY: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  orders.forEach(order => {
    ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
  });

  const paymentSummary: Record<string, number> = {
    PENDING: 0,
    PARTIALLY_PAID: 0,
    PAID: 0,
    FAILED: 0,
    CANCELLED: 0,
  };

  orders.forEach(order => {
    paymentSummary[order.paymentStatus] = (paymentSummary[order.paymentStatus] || 0) + 1;
  });

  const itemCounts: Record<string, number> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const name = item.itemNameSnapshot;
      itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
    });
  });

  const topItems = Object.entries(itemCounts)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    totalRevenue: totalRevenue.toString(),
    totalOrders,
    ordersByStatus,
    paymentBreakdown: paymentSummary,
    topItems,
  };
}

export async function getRevenueStats(params?: { period?: 'daily' | 'weekly' | 'monthly' }) {
  const period = params?.period || 'daily';
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

  const orders = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
  });

  const revenueByPeriod: Record<string, string> = {};

  if (period === 'daily') {
    orders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      const current = revenueByPeriod[dateKey] ? parseFloat(revenueByPeriod[dateKey]) : 0;
      revenueByPeriod[dateKey] = (current + Number(order.totalAmount)).toFixed(2);
    });
  } else if (period === 'weekly') {
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      const current = revenueByPeriod[weekKey] ? parseFloat(revenueByPeriod[weekKey]) : 0;
      revenueByPeriod[weekKey] = (current + Number(order.totalAmount)).toFixed(2);
    });
  } else {
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyTotal = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    revenueByPeriod[monthKey] = monthlyTotal.toFixed(2);
  }

  return { revenue: revenueByPeriod };
}

export default {
  getReports,
  getRevenueStats,
};
