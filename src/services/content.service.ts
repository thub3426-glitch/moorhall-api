import prisma from '../config/db';
import ApiError from '../utils/apiError';

export async function getContentBlocks() {
  return prisma.contentSection.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateContentBlock(id: number, data: {
  title?: string;
  body?: string;
  dataJson?: any;
  isPublished?: boolean;
}) {
  const block = await prisma.contentSection.findUnique({ where: { id } });
  if (!block) {
    throw ApiError.notFound('Content block not found');
  }

  return prisma.contentSection.update({
    where: { id },
    data: {
      title: data.title !== undefined ? data.title : block.title,
      body: data.body !== undefined ? data.body : block.body,
      dataJson: data.dataJson !== undefined ? data.dataJson : block.dataJson,
      isPublished: data.isPublished !== undefined ? data.isPublished : block.isPublished,
    },
  });
}

export async function getPromoBanners() {
  return prisma.promotion.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updatePromoBanner(id: number, data: {
  title?: string;
  description?: string;
  imageUrl?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}) {
  const banner = await prisma.promotion.findUnique({ where: { id } });
  if (!banner) {
    throw ApiError.notFound('Promo banner not found');
  }

  return prisma.promotion.update({
    where: { id },
    data: {
      title: data.title || banner.title,
      description: data.description !== undefined ? data.description : banner.description,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : banner.imageUrl,
      startDate: data.startDate || banner.startDate,
      endDate: data.endDate || banner.endDate,
      isActive: data.isActive !== undefined ? data.isActive : banner.isActive,
    },
  });
}

export default {
  getContentBlocks,
  updateContentBlock,
  getPromoBanners,
  updatePromoBanner,
};
