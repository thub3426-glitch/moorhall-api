import prisma from '../config/db';
import ApiError from '../utils/apiError';

export async function getReservations(filters?: { status?: string; page?: number; limit?: number }) {
  const where: any = {};
  if (filters?.status) {
    where.status = filters.status;
  }

  const skip = (filters?.page ? filters.page - 1 : 0) * (filters?.limit || 20);
  const take = filters?.limit || 20;

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { reservationDate: 'desc' },
    skip,
    take,
  });

  const total = await prisma.reservation.count({ where });

  return { reservations, total };
}

export async function getReservationById(id: number) {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) {
    throw ApiError.notFound('Reservation not found');
  }
  return reservation;
}

export async function updateReservationStatus(id: number, status: string) {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) {
    throw ApiError.notFound('Reservation not found');
  }

  return prisma.reservation.update({
    where: { id },
    data: { status: status as any },
  });
}

export async function createReservation(data: {
  customerName: string;
  phoneNumber: string;
  reservationDate: string | Date;
  reservationTime: string;
  guestCount: number | string;
  status?: string;
  notes?: string;
}) {
  const normalizedGuestCount =
    typeof data.guestCount === 'string'
      ? Number.parseInt(data.guestCount, 10)
      : typeof data.guestCount === 'number'
        ? data.guestCount
        : 0;

  const guestCount = Number.isFinite(normalizedGuestCount) ? normalizedGuestCount : 0;

  return prisma.reservation.create({
    data: {
      customerName: data.customerName,
      phoneNumber: data.phoneNumber,
      reservationDate: new Date(data.reservationDate),
      reservationTime: data.reservationTime,
      guestCount,
      status: (data.status as any) || 'PENDING',
      notes: data.notes,
    },
  });
}

export async function deleteReservation(id: number) {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) {
    throw ApiError.notFound('Reservation not found');
  }
  await prisma.reservation.delete({ where: { id } });
}

export default {
  getReservations,
  getReservationById,
  updateReservationStatus,
  createReservation,
  deleteReservation,
};
