import prisma from '../config/db';
import ApiError from '../utils/apiError';

export async function getSettings() {
  return prisma.siteSetting.findMany({
    orderBy: { key: 'asc' },
  });
}

export async function updateSetting(id: number, data: {
  value: string;
}) {
  const setting = await prisma.siteSetting.findUnique({ where: { id } });
  if (!setting) {
    throw ApiError.notFound('Setting not found');
  }

  return prisma.siteSetting.update({
    where: { id },
    data: {
      value: data.value,
    },
  });
}

export async function getSettingByKey(key: string) {
  return prisma.siteSetting.findUnique({ where: { key } });
}

export default {
  getSettings,
  updateSetting,
  getSettingByKey,
};
