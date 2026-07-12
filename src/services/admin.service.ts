import prisma from '../config/db';

export async function getDashboardStats() {
  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    cancelledOrders,
    totalCustomers,
    totalMenuItems,
    totalCategories,
    totalRevenue,
    todayOrders,
    todayRevenue,
    totalReservations,
    totalCateringRequests,
    recentOrders,
    popularItems,
    revenueByDay,
    paymentSummary,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'CONFIRMED' } }),
    prisma.order.count({ where: { status: 'PREPARING' } }),
    prisma.order.count({ where: { status: 'READY' } }),
    prisma.order.count({ where: { status: 'COMPLETED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.order.findMany({
      select: { customerPhone: true },
      distinct: ['customerPhone'],
    }),
    prisma.menuItem.count(),
    prisma.menuCategory.count({ where: { isActive: true } }),
    prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _sum: { totalAmount: true },
    }),
    // Reservations count
    prisma.reservation.count(),
    // Catering requests count
    prisma.cateringRequest.count(),
    // Recent orders (last 5)
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    }),
    // Popular items (top 5 by order count)
    prisma.orderItem.groupBy({
      by: ['itemNameSnapshot'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    // Revenue by day (last 7 days)
    (async () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const result = await prisma.order.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
          _sum: { totalAmount: true },
        });
        
        days.push({
          date: date.toISOString().split('T')[0],
          amount: result._sum.totalAmount?.toNumber() || 0,
        });
      }
      return days;
    })(),
    // Payment summary by status
    (async () => {
      const [waitingPayment, partiallyPaid, paid, failed, cancelled] = await Promise.all([
        prisma.payment.count({ where: { status: 'WAITING_PAYMENT' } }),
        prisma.payment.count({ where: { status: 'PARTIALLY_PAID' } }),
        prisma.payment.count({ where: { status: 'PAID' } }),
        prisma.payment.count({ where: { status: 'FAILED' } }),
        prisma.payment.count({ where: { status: 'CANCELLED' } }),
      ]);
      return { pending: waitingPayment, partial: partiallyPaid, paid, failed, cancelled };
    })(),
  ]);

  const ordersByStatus = {
    REQUESTED: pendingOrders,
    CONFIRMED: confirmedOrders,
    PREPARING: preparingOrders,
    READY: readyOrders,
    COMPLETED: completedOrders,
    CANCELLED: cancelledOrders,
  };

  return {
    overview: {
      totalOrders,
      totalCustomers: totalCustomers.length,
      totalMenuItems,
      totalCategories,
      totalRevenue: totalRevenue._sum.totalAmount?.toString() || '0',
      todayOrders,
      todayRevenue: todayRevenue._sum.totalAmount?.toString() || '0',
      totalReservations,
      totalCateringRequests,
    },
    ordersByStatus,
     recentOrders: recentOrders.map(order => {
       // Map Prisma order statuses to frontend expected statuses
       const statusMap: Record<string, string> = {
         PENDING: 'new',
         CONFIRMED: 'confirmed',
         PREPARING: 'preparing',
         READY: 'ready',
         OUT_FOR_DELIVERY: 'out_for_delivery',
         COMPLETED: 'completed',
         CANCELLED: 'cancelled',
         // Map other statuses to appropriate frontend statuses
         PAYMENT_WAITING: 'new',
         PAYMENT_UNDER_REVIEW: 'new',
         APPROVED: 'confirmed',
       };
       
       return {
         id: order.id.toString(),
         orderNumber: order.orderNumber,
         customer: { name: order.customerName },
         createdAt: order.createdAt.toISOString(),
         total: order.totalAmount.toNumber(),
         status: statusMap[order.status] || order.status.toLowerCase(),
       };
     }),
    popularItems: popularItems.map(item => ({
      name: item.itemNameSnapshot,
      count: item._count.id,
    })),
    revenueByDay,
    paymentSummary,
  };
}

export default { getDashboardStats };
