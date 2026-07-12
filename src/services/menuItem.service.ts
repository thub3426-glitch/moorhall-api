import prisma from '../config/db';
import ApiError from '../utils/apiError';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const categoryToProductType: Record<string, string> = {
  food: 'FOOD',
  coffee: 'COFFEE',
  drink: 'DRINK',
  bakery: 'BAKERY',
  special: 'FOOD',
};

export interface PdfMenuItemInput {
  name: string;
  price: number;
  description?: string;
  category?: string;
}

export async function createMenuItemFromPdfExtraction(
  items: PdfMenuItemInput[],
  images: { secure_url: string; public_id: string }[],
  categoryId?: number
) {
  const dbCategories = await prisma.menuCategory.findMany();
  const categoryMap = new Map(dbCategories.map((c) => [c.name.toLowerCase(), c.id]));

  const existingSlugs = await prisma.menuItem.findMany({
    select: { slug: true },
  });
  const slugSet = new Set(existingSlugs.map((m) => m.slug));

  const createdItems: any[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const image = images[i];

    let resolvedCategoryId = categoryId;
    if (resolvedCategoryId === undefined && item.category) {
      const catLower = item.category.toLowerCase();
      if (categoryMap.has(catLower)) {
        resolvedCategoryId = categoryMap.get(catLower)!;
      }
    }

    if (!resolvedCategoryId) {
      resolvedCategoryId = dbCategories[0]?.id;
    }

    if (!resolvedCategoryId) {
      throw ApiError.badRequest('No valid category available for menu item creation');
    }

    let slug = toSlug(item.name);
    let slugCounter = 1;
    let uniqueSlug = slug;
    while (slugSet.has(uniqueSlug)) {
      uniqueSlug = `${slug}-${slugCounter}`;
      slugCounter++;
    }
    slugSet.add(uniqueSlug);

    const productType = categoryToProductType[item.category || 'food'] || 'FOOD';

    const menuItem = await prisma.menuItem.create({
      data: {
        name: item.name,
        slug: uniqueSlug,
        categoryId: resolvedCategoryId,
        description: item.description,
        shortDescription: item.description?.slice(0, 100),
        productType: productType as any,
        price: item.price,
        imageUrl: image?.secure_url,
        imagePublicId: image?.public_id,
        isAvailable: true,
      },
    });

    createdItems.push(normalizeMenuItem(menuItem));
  }

  return createdItems;
}

/** Normalize a MenuItem returned by Prisma for API responses
 * - Convert Decimal price to number
 * - Ensure `images` is an array
 * - Prefer `imageUrl` as the image field
 */
function normalizeMenuItem(item: any) {
  if (!item) return item;

  const price = item.price !== undefined && item.price !== null
    ? (typeof item.price === 'object' && typeof item.price.toString === 'function'
        ? parseFloat(item.price.toString())
        : Number(item.price))
    : item.price;

  return {
    ...item,
    price,
    images: Array.isArray(item.images) ? item.images : (item.images ?? []),
    imageUrl: item.imageUrl ?? item.image ?? undefined,
  };
}

export async function createMenuItem(data: {
  name: string;
  slug: string;
  categoryId: number;
  shortDescription?: string;
  description?: string;
  productType: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  preparationTime?: number;
  sku?: string;
}) {
  const category = await prisma.menuCategory.findUnique({ where: { id: data.categoryId } });
  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  const existingSlug = await prisma.menuItem.findUnique({ where: { slug: data.slug } });
  if (existingSlug) {
    throw ApiError.conflict('Menu item with this slug already exists');
  }

  if (data.sku) {
    const existingSku = await prisma.menuItem.findUnique({ where: { sku: data.sku } });
    if (existingSku) {
      throw ApiError.conflict('SKU already exists');
    }
  }

  const menuItem = await prisma.menuItem.create({
    data: {
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,
      shortDescription: data.shortDescription,
      description: data.description,
      productType: data.productType as any,
      price: data.price,
      imageUrl: data.imageUrl,
      images: data.images,
      preparationTime: data.preparationTime,
      sku: data.sku,
    },
  });

  return normalizeMenuItem(menuItem);
}

export async function getMenuItems(categoryId?: number, includeUnavailable = false) {
  const items = await prisma.menuItem.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(includeUnavailable ? {} : { isAvailable: true }),
    },
    include: { category: true },
    orderBy: { name: 'asc' },
  });

  return items.map(normalizeMenuItem);
}

export async function getMenuItemById(id: number) {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!menuItem) {
    throw ApiError.notFound('Menu item not found');
  }
  return normalizeMenuItem(menuItem);
}

export async function updateMenuItem(id: number, data: {
  name?: string;
  shortDescription?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  imagePublicId?: string;
  images?: string[];
  isAvailable?: boolean;
  isFeatured?: boolean;
  preparationTime?: number;
  categoryId?: number;
}) {
  const menuItem = await prisma.menuItem.findUnique({ where: { id } });
  if (!menuItem) {
    throw ApiError.notFound('Menu item not found');
  }

  if (data.categoryId) {
    const category = await prisma.menuCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw ApiError.notFound('Category not found');
    }
  }

  const updated = await prisma.menuItem.update({
    where: { id },
    data: {
      name: data.name || menuItem.name,
      shortDescription: data.shortDescription !== undefined ? data.shortDescription : menuItem.shortDescription,
      description: data.description !== undefined ? data.description : menuItem.description,
      price: data.price !== undefined ? data.price : menuItem.price,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : menuItem.imageUrl,
      imagePublicId: data.imagePublicId !== undefined ? data.imagePublicId : menuItem.imagePublicId,
      images: data.images !== undefined ? (data.images as any) : menuItem.images,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : menuItem.isAvailable,
      isFeatured: data.isFeatured !== undefined ? data.isFeatured : menuItem.isFeatured,
      preparationTime: data.preparationTime !== undefined ? data.preparationTime : menuItem.preparationTime,
      categoryId: data.categoryId || menuItem.categoryId,
    },
  });

  return normalizeMenuItem(updated);
}

export async function toggleAvailability(id: number) {
  const menuItem = await prisma.menuItem.findUnique({ where: { id } });
  if (!menuItem) {
    throw ApiError.notFound('Menu item not found');
  }

  const updated = await prisma.menuItem.update({
    where: { id },
    data: { isAvailable: !menuItem.isAvailable },
  });

  return normalizeMenuItem(updated);
}

export async function deleteMenuItem(id: number) {
  const menuItem = await prisma.menuItem.findUnique({ where: { id } });
  if (!menuItem) {
    throw ApiError.notFound('Menu item not found');
  }

  await prisma.menuItem.delete({ where: { id } });
}

// ─── Public service methods (no auth required) ─────────────────────────────────

export async function getPublicMenuItems(categoryId?: number, productType?: string) {
  const items = await prisma.menuItem.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(productType ? { productType: productType as any } : {}),
      isAvailable: true,
    },
    include: { category: true },
    orderBy: { name: 'asc' },
  });

  return items.map(normalizeMenuItem);
}

export async function getPublicMenuItemById(id: number) {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!menuItem) {
    throw ApiError.notFound('Menu item not found');
  }
  return normalizeMenuItem(menuItem);
}

// ─── Home Page Menu (hierarchical with categories) ───────────────────────────────

/**
 * Get complete menu organized by active categories with items
 * Used by home page to display menu in category hierarchy
 * Returns only available items and active categories
 */
export async function getHomePageMenu() {
  const categories = await prisma.menuCategory.findMany({
    where: { isActive: true },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { displayOrder: 'asc' },
  });

  // Filter out empty categories and normalize all items
  const result = categories
    .filter((cat) => cat.items.length > 0)
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      type: category.type,
      displayOrder: category.displayOrder,
      items: category.items.map(normalizeMenuItem),
    }));

  return result;
}

/**
 * Get items for a specific category with full details
 */
export async function getCategoryWithItems(categoryId: number) {
  const category = await prisma.menuCategory.findUnique({
    where: { id: categoryId },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    type: category.type,
    displayOrder: category.displayOrder,
    items: category.items.map(normalizeMenuItem),
  };
}

/**
 * Get all active categories (for filtering/navigation)
 */
export async function getActiveCategories() {
  const categories = await prisma.menuCategory.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });

  return categories;
}

export default {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
  getPublicMenuItems,
  getPublicMenuItemById,
  getHomePageMenu,
  getCategoryWithItems,
  getActiveCategories,
  createMenuItemFromPdfExtraction,
};
