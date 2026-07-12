import prisma from '../config/db';
import ApiError from '../utils/apiError';

export async function getPayments(filters?: { orderId?: number; page?: number; limit?: number }) {
  const where: any = {};
  if (filters?.orderId) {
    where.orderId = filters.orderId;
  }

  const skip = (filters?.page ? filters.page - 1 : 0) * (filters?.limit || 20);
  const take = filters?.limit || 20;

  const payments = await prisma.payment.findMany({
    where,
    include: {
      order: true,
      verifiedBy: {
        select: { id: true, fullName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });

  const total = await prisma.payment.count({ where });

  return { payments, total };
}

export async function getPaymentById(id: number) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      order: true,
      verifiedBy: {
        select: { id: true, fullName: true },
      },
    },
  });
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }
  return payment;
}

export async function verifyPayment(id: number, status: 'VERIFIED' | 'REJECTED', adminId: number, note?: string) {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  const updateData: any = {
    verifiedByAdminId: adminId,
    verifiedAt: new Date(),
  };

  if (status === 'VERIFIED') {
    updateData.status = 'PAID';
  } else if (status === 'REJECTED') {
    updateData.status = 'FAILED';
  }

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: updateData,
    include: {
      order: true,
      verifiedBy: {
        select: { id: true, fullName: true },
      },
    },
  });

  return updatedPayment;
}

export default {
  getPayments,
  getPaymentById,
  verifyPayment,
};
