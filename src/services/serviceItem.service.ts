import prisma from '../config/db';
import ApiError from '../utils/apiError';

export async function createServiceItem(data: {
  name: string;
  slug: string;
  type: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string;
  isActive?: boolean;
}) {
  return prisma.serviceItem.create({
    data: {
      name: data.name,
      slug: data.slug,
      type: data.type as any,
      description: data.description,
      imageUrl: data.imageUrl,
      imagePublicId: data.imagePublicId,
      isActive: data.isActive ?? true,
    },
  });
}

export async function getServiceItems() {
  return prisma.serviceItem.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getServiceItemById(id: number) {
  const serviceItem = await prisma.serviceItem.findUnique({ where: { id } });
  if (!serviceItem) {
    throw ApiError.notFound('Service item not found');
  }
  return serviceItem;
}

export async function updateServiceItem(id: number, data: {
  name?: string;
  slug?: string;
  type?: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string;
  isActive?: boolean;
}) {
  const serviceItem = await prisma.serviceItem.findUnique({ where: { id } });
  if (!serviceItem) {
    throw ApiError.notFound('Service item not found');
  }

  return prisma.serviceItem.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      type: data.type as any,
      description: data.description,
      imageUrl: data.imageUrl,
      imagePublicId: data.imagePublicId,
      isActive: data.isActive,
    },
  });
}

export async function deleteServiceItem(id: number) {
  const serviceItem = await prisma.serviceItem.findUnique({ where: { id } });
  if (!serviceItem) {
    throw ApiError.notFound('Service item not found');
  }
  await prisma.serviceItem.delete({ where: { id } });
}

export async function toggleServiceStatus(id: number) {
  const serviceItem = await prisma.serviceItem.findUnique({ where: { id } });
  if (!serviceItem) {
    throw ApiError.notFound('Service item not found');
  }

  return prisma.serviceItem.update({
    where: { id },
    data: { isActive: !serviceItem.isActive },
  });
}

export default {
  createServiceItem,
  getServiceItems,
  getServiceItemById,
  updateServiceItem,
  deleteServiceItem,
  toggleServiceStatus,
};