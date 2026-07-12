import prisma from '../config/db';
import ApiError from '../utils/apiError';

export async function createCategory(data: { name: string; slug: string; description?: string; type: string; displayOrder?: number; isActive?: boolean }) {
  const existing = await prisma.menuCategory.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw ApiError.conflict('Category with this slug already exists');
  }

  const category = await prisma.menuCategory.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      type: data.type as any,
      displayOrder: data.displayOrder || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });

  return category;
}

export async function getCategories(includeInactive = false) {
  return prisma.menuCategory.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });
}

export async function getCategoryById(id: number) {
  const category = await prisma.menuCategory.findUnique({ where: { id } });
  if (!category) {
    throw ApiError.notFound('Category not found');
  }
  return category;
}

export async function updateCategory(id: number, data: { name?: string; description?: string; type?: string; displayOrder?: number; isActive?: boolean }) {
  const category = await prisma.menuCategory.findUnique({ where: { id } });
  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  return prisma.menuCategory.update({
    where: { id },
    data: {
      name: data.name || category.name,
      description: data.description !== undefined ? data.description : category.description,
      type: (data.type as any) || category.type,
      displayOrder: data.displayOrder !== undefined ? data.displayOrder : category.displayOrder,
      isActive: data.isActive !== undefined ? data.isActive : category.isActive,
    },
  });
}

export async function deleteCategory(id: number) {
  const category = await prisma.menuCategory.findUnique({
    where: { id },
    include: { items: { select: { id: true } } },
  });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  if (category.items.length > 0) {
    throw ApiError.badRequest('Cannot delete category with menu items');
  }

  await prisma.menuCategory.delete({ where: { id } });
}

export default { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory };
