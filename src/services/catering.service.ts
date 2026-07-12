import prisma from '../config/db';
import ApiError from '../utils/apiError';

export async function getCateringRequests(filters?: { status?: string; page?: number; limit?: number }) {
  const where: any = {};
  if (filters?.status) {
    where.status = filters.status;
  }

  const skip = (filters?.page ? filters.page - 1 : 0) * (filters?.limit || 20);
  const take = filters?.limit || 20;

  const requests = await prisma.cateringRequest.findMany({
    where,
    orderBy: { preferredDate: 'desc' },
    skip,
    take,
  });

  const total = await prisma.cateringRequest.count({ where });

  return { requests, total };
}

export async function getCateringRequestById(id: number) {
  const request = await prisma.cateringRequest.findUnique({ where: { id } });
  if (!request) {
    throw ApiError.notFound('Catering request not found');
  }
  return request;
}

export async function updateCateringStatus(id: number, status: string) {
  const request = await prisma.cateringRequest.findUnique({ where: { id } });
  if (!request) {
    throw ApiError.notFound('Catering request not found');
  }

  return prisma.cateringRequest.update({
    where: { id },
    data: { status: status as any },
  });
}

export async function createCateringRequest(data: {
  customerName: string;
  phoneNumber: string;
  email?: string;
  eventType: string;
  eventLocation: string;
  preferredDate: string;
  guestCount: number;
  budgetRange?: string;
  notes?: string;
}) {
  return prisma.cateringRequest.create({
    data: {
      customerName: data.customerName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      eventType: data.eventType,
      eventLocation: data.eventLocation,
      preferredDate: new Date(data.preferredDate),
      guestCount: data.guestCount,
      budgetRange: data.budgetRange,
      notes: data.notes,
      status: 'PENDING',
    },
  });
}

export async function deleteCateringRequest(id: number) {
  const request = await prisma.cateringRequest.findUnique({ where: { id } });
  if (!request) {
    throw ApiError.notFound('Catering request not found');
  }
  await prisma.cateringRequest.delete({ where: { id } });
}

export default {
  getCateringRequests,
  getCateringRequestById,
  updateCateringStatus,
  createCateringRequest,
  deleteCateringRequest,
};
