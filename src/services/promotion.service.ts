import { Prisma } from '@prisma/client';
import db from '../config/db';

const promotionService = {
  /**
   * Get all active promotions with caching support
   */
  async getActivePromotions() {
    const promotions = await db.promotion.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    return promotions;
  },

  /**
   * Get all promotions (including inactive) - admin use
   */
  async getAllPromotions() {
    const promotions = await db.promotion.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return promotions;
  },

  /**
   * Get promotion by ID
   */
  async getPromotionById(id: number) {
    const promotion = await db.promotion.findUnique({
      where: { id },
    });
    if (!promotion) {
      throw new Error(`Promotion with ID ${id} not found`);
    }
    return promotion;
  },

  /**
   * Create new promotion
   */
  async createPromotion(data: Prisma.PromotionCreateInput) {
    const promotion = await db.promotion.create({
      data,
    });
    return promotion;
  },

  /**
   * Update promotion
   */
  async updatePromotion(id: number, data: Prisma.PromotionUpdateInput) {
    const promotion = await db.promotion.update({
      where: { id },
      data,
    });
    return promotion;
  },

  /**
   * Delete promotion
   */
  async deletePromotion(id: number) {
    const promotion = await db.promotion.delete({
      where: { id },
    });
    return promotion;
  },

  /**
   * Toggle promotion active status
   */
  async togglePromotionStatus(id: number) {
    const promotion = await db.promotion.findUnique({
      where: { id },
    });
    if (!promotion) {
      throw new Error(`Promotion with ID ${id} not found`);
    }

    return db.promotion.update({
      where: { id },
      data: { isActive: !promotion.isActive },
    });
  },
};

export default promotionService;
